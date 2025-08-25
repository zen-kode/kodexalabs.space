import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { logger } from './logger';
import { securityMonitor } from './security-monitor';

// Types
export interface FirebaseUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface FirebaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface QueryOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  startAfterDoc?: DocumentSnapshot;
  filters?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any';
    value: any;
  }>;
}

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  metadata?: Record<string, string>;
}

// Firebase Service Class
export class FirebaseService {
  private static instance: FirebaseService;
  private authUnsubscribe: Unsubscribe | null = null;
  private currentUser: User | null = null;

  private constructor() {
    this.initializeAuthListener();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Authentication Methods
  private initializeAuthListener(): void {
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        logger.info('User authenticated', {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        });
        securityMonitor.logEvent({
          type: 'AUTH_SUCCESS',
          severity: 'INFO',
          message: 'User authenticated successfully',
          metadata: { userId: user.uid, email: user.email }
        });
      } else {
        logger.info('User signed out');
      }
    });
  }

  async signIn(email: string, password: string): Promise<{ user: FirebaseUser | null; error: any }> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = this.mapFirebaseUser(result.user);
      
      logger.info('User signed in successfully', { userId: result.user.uid, email });
      securityMonitor.logEvent({
        type: 'AUTH_SUCCESS',
        severity: 'INFO',
        message: 'User signed in successfully',
        metadata: { userId: result.user.uid, email }
      });
      
      return { user, error: null };
    } catch (error: any) {
      logger.error('Sign in failed', { email, error: error.message });
      securityMonitor.logEvent({
        type: 'AUTH_FAILURE',
        severity: 'MEDIUM',
        message: 'Sign in attempt failed',
        metadata: { email, error: error.code }
      });
      
      return { user: null, error };
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<{ user: FirebaseUser | null; error: any }> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      const user = this.mapFirebaseUser(result.user);
      
      logger.info('User signed up successfully', { userId: result.user.uid, email });
      securityMonitor.logEvent({
        type: 'USER_CREATED',
        severity: 'INFO',
        message: 'New user account created',
        metadata: { userId: result.user.uid, email }
      });
      
      return { user, error: null };
    } catch (error: any) {
      logger.error('Sign up failed', { email, error: error.message });
      securityMonitor.logEvent({
        type: 'AUTH_FAILURE',
        severity: 'MEDIUM',
        message: 'Sign up attempt failed',
        metadata: { email, error: error.code }
      });
      
      return { user: null, error };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      const userId = this.currentUser?.uid;
      await signOut(auth);
      
      logger.info('User signed out successfully', { userId });
      securityMonitor.logEvent({
        type: 'AUTH_LOGOUT',
        severity: 'INFO',
        message: 'User signed out successfully',
        metadata: { userId }
      });
      
      return { error: null };
    } catch (error: any) {
      logger.error('Sign out failed', { error: error.message });
      return { error };
    }
  }

  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      await sendPasswordResetEmail(auth, email);
      
      logger.info('Password reset email sent', { email });
      securityMonitor.logEvent({
        type: 'PASSWORD_RESET_REQUEST',
        severity: 'INFO',
        message: 'Password reset email sent',
        metadata: { email }
      });
      
      return { error: null };
    } catch (error: any) {
      logger.error('Password reset failed', { email, error: error.message });
      return { error };
    }
  }

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser ? this.mapFirebaseUser(this.currentUser) : null;
  }

  private mapFirebaseUser(user: User): FirebaseUser {
    return {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      emailVerified: user.emailVerified,
      createdAt: new Date(user.metadata.creationTime || Date.now()),
      lastLoginAt: new Date(user.metadata.lastSignInTime || Date.now())
    };
  }

  // Firestore Database Methods
  async createDocument(collectionName: string, data: any): Promise<{ data: FirebaseDocument | null; error: any }> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const document = this.mapFirestoreDocument(docSnap);
        logger.info('Document created successfully', {
          collection: collectionName,
          documentId: docRef.id
        });
        return { data: document, error: null };
      }
      
      return { data: null, error: new Error('Document creation failed') };
    } catch (error: any) {
      logger.error('Document creation failed', {
        collection: collectionName,
        error: error.message
      });
      return { data: null, error };
    }
  }

  async getDocument(collectionName: string, documentId: string): Promise<{ data: FirebaseDocument | null; error: any }> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const document = this.mapFirestoreDocument(docSnap);
        return { data: document, error: null };
      }
      
      return { data: null, error: new Error('Document not found') };
    } catch (error: any) {
      logger.error('Document retrieval failed', {
        collection: collectionName,
        documentId,
        error: error.message
      });
      return { data: null, error };
    }
  }

  async updateDocument(collectionName: string, documentId: string, data: any): Promise<{ error: any }> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      logger.info('Document updated successfully', {
        collection: collectionName,
        documentId
      });
      
      return { error: null };
    } catch (error: any) {
      logger.error('Document update failed', {
        collection: collectionName,
        documentId,
        error: error.message
      });
      return { error };
    }
  }

  async deleteDocument(collectionName: string, documentId: string): Promise<{ error: any }> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      
      logger.info('Document deleted successfully', {
        collection: collectionName,
        documentId
      });
      
      return { error: null };
    } catch (error: any) {
      logger.error('Document deletion failed', {
        collection: collectionName,
        documentId,
        error: error.message
      });
      return { error };
    }
  }

  async queryDocuments(collectionName: string, options: QueryOptions = {}): Promise<{ data: FirebaseDocument[]; error: any }> {
    try {
      let q = collection(db, collectionName);
      
      // Apply filters
      if (options.filters) {
        options.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }
      
      // Apply ordering
      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'));
      }
      
      // Apply pagination
      if (options.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }
      
      // Apply limit
      if (options.limitCount) {
        q = query(q, limit(options.limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => this.mapFirestoreDocument(doc));
      
      return { data: documents, error: null };
    } catch (error: any) {
      logger.error('Document query failed', {
        collection: collectionName,
        options,
        error: error.message
      });
      return { data: [], error };
    }
  }

  subscribeToDocument(collectionName: string, documentId: string, callback: (doc: FirebaseDocument | null) => void): Unsubscribe {
    const docRef = doc(db, collectionName, documentId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const document = this.mapFirestoreDocument(docSnap);
        callback(document);
      } else {
        callback(null);
      }
    }, (error) => {
      logger.error('Document subscription error', {
        collection: collectionName,
        documentId,
        error: error.message
      });
      callback(null);
    });
  }

  subscribeToCollection(collectionName: string, options: QueryOptions, callback: (docs: FirebaseDocument[]) => void): Unsubscribe {
    let q = collection(db, collectionName);
    
    // Apply filters and ordering (same as queryDocuments)
    if (options.filters) {
      options.filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    if (options.orderByField) {
      q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'));
    }
    
    if (options.limitCount) {
      q = query(q, limit(options.limitCount));
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => this.mapFirestoreDocument(doc));
      callback(documents);
    }, (error) => {
      logger.error('Collection subscription error', {
        collection: collectionName,
        error: error.message
      });
      callback([]);
    });
  }

  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    documentId?: string;
    data?: any;
  }>): Promise<{ error: any }> {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(op => {
        const docRef = op.documentId 
          ? doc(db, op.collection, op.documentId)
          : doc(collection(db, op.collection));
        
        switch (op.type) {
          case 'create':
            batch.set(docRef, {
              ...op.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: serverTimestamp()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
      
      logger.info('Batch write completed successfully', {
        operationsCount: operations.length
      });
      
      return { error: null };
    } catch (error: any) {
      logger.error('Batch write failed', {
        operationsCount: operations.length,
        error: error.message
      });
      return { error };
    }
  }

  private mapFirestoreDocument(docSnap: DocumentSnapshot): FirebaseDocument {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date()
    } as FirebaseDocument;
  }

  // Storage Methods
  async uploadFile(file: File, options: UploadOptions = {}): Promise<{ url: string | null; error: any }> {
    try {
      const folder = options.folder || 'uploads';
      const fileName = options.fileName || `${Date.now()}_${file.name}`;
      const filePath = `${folder}/${fileName}`;
      
      const storageRef = ref(storage, filePath);
      const metadata = {
        contentType: file.type,
        customMetadata: options.metadata || {}
      };
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      logger.info('File uploaded successfully', {
        fileName,
        filePath,
        size: file.size,
        type: file.type
      });
      
      return { url: downloadURL, error: null };
    } catch (error: any) {
      logger.error('File upload failed', {
        fileName: file.name,
        error: error.message
      });
      return { url: null, error };
    }
  }

  async deleteFile(filePath: string): Promise<{ error: any }> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      
      logger.info('File deleted successfully', { filePath });
      return { error: null };
    } catch (error: any) {
      logger.error('File deletion failed', {
        filePath,
        error: error.message
      });
      return { error };
    }
  }

  async listFiles(folderPath: string): Promise<{ files: string[]; error: any }> {
    try {
      const storageRef = ref(storage, folderPath);
      const result = await listAll(storageRef);
      
      const files = result.items.map(item => item.fullPath);
      
      return { files, error: null };
    } catch (error: any) {
      logger.error('File listing failed', {
        folderPath,
        error: error.message
      });
      return { files: [], error };
    }
  }

  // Cleanup
  destroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();
export default firebaseService;