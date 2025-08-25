'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Circle,
  StickyNote,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

// Mock data
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Sample Task',
    description: 'This is a sample task for demonstration',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Sample Note',
    content: 'This is a sample note for demonstration purposes.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['sample']
  }
];

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

function TaskItem({ task, onEdit, onDelete, onToggleStatus }: TaskItemProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Circle className="h-4 w-4 text-gray-400" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className={cn(
      "flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors",
      task.status === 'completed' && "opacity-75"
    )}>
      <button
        onClick={() => onToggleStatus(task.id)}
        className="mt-1 hover:scale-110 transition-transform"
      >
        {getStatusIcon(task.status)}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "font-medium text-sm",
            task.status === 'completed' && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
          <div className="flex items-center space-x-2">
            <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
          {task.updatedAt !== task.createdAt && (
            <span>• Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface NoteItemProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

function NoteItem({ note, onEdit, onDelete }: NoteItemProps) {
  return (
    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-2">{note.title}</h4>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
            {note.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(note)}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskNotepad() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    };
    
    setNotes([newNote, ...notes]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newStatus = task.status === 'completed' ? 'pending' : 
                         task.status === 'pending' ? 'in_progress' : 'completed';
        return { ...task, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return task;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleEditTask = (task: Task) => {
    // Task editing functionality to be implemented
  };

  const handleEditNote = (note: Note) => {
    // Note editing functionality to be implemented
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Task & Notes Manager
        </CardTitle>
        <CardDescription>
          Project management and note-taking for development tasks
        </CardDescription>
        
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'tasks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('tasks')}
            className="text-xs"
          >
            Tasks ({totalTasks})
          </Button>
          <Button
            variant={activeTab === 'notes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('notes')}
            className="text-xs"
          >
            Notes ({notes.length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {activeTab === 'tasks' && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Progress: {completedTasks}/{totalTasks} completed
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
            
            {isAddingTask && (
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddTask}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAddingTask(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onToggleStatus={handleToggleTaskStatus}
                />
              ))}
            </div>
          </>
        )}
        
        {activeTab === 'notes' && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {notes.length} notes saved
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNote(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>
            
            {isAddingNote && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                <Input
                  placeholder="Note title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Note content..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={handleAddNote}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingNote(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}