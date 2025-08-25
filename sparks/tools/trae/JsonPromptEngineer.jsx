import React, { useState } from 'react';

const PlaceholderAgent = () => {
  const [document, setDocument] = useState('');
  const [placeholders, setPlaceholders] = useState([]);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [replacements, setReplacements] = useState({});
  const [processedDocument, setProcessedDocument] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Document Placeholder Agent. Please paste your document with placeholders (like {{name}} or [company]) and I\'ll help you replace them.' }
  ]);

  const findPlaceholders = (text) => {
    const regex = /\{\{([^}]+)\}\}|\[([^\]]+)\]/g;
    const found = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const placeholder = match[1] || match[2];
      if (!found.includes(placeholder)) {
        found.push(placeholder);
      }
    }
    return found;
  };

  const processDocument = () => {
    if (!document.trim()) return;
    
    const foundPlaceholders = findPlaceholders(document);
    setPlaceholders(foundPlaceholders);
    setCurrentPlaceholderIndex(0);
    setReplacements({});
    setIsProcessing(true);
    setShowPreview(false);
    
    if (foundPlaceholders.length === 0) {
      setConversation(prev => [...prev, 
        { role: 'user', content: 'Process document' },
        { role: 'assistant', content: 'No placeholders found in the document. Please add placeholders using {{placeholder}} or [placeholder] format.' }
      ]);
      setIsProcessing(false);
      return;
    }
    
    setConversation(prev => [...prev, 
      { role: 'user', content: 'Process document' },
      { role: 'assistant', content: `Found ${foundPlaceholders.length} placeholders: ${foundPlaceholders.join(', ')}. Let's replace them one by one. First placeholder: "${foundPlaceholders[0]}" - Enter replacement value or type 'skip':` }
    ]);
  };

  const handleUserInput = (event) => {
    if (event.key === 'Enter') {
      const userInput = event.target.value;
      setInputValue('');
      
      if (!isProcessing) {
        if (userInput.toLowerCase() === 'process' || userInput.toLowerCase() === 'start') {
          processDocument();
        } else {
          setConversation(prev => [...prev, 
            { role: 'user', content: userInput },
            { role: 'assistant', content: 'Please paste your document above and type "process" to start finding placeholders.' }
          ]);
        }
        return;
      }
      
      const currentPlaceholder = placeholders[currentPlaceholderIndex];
      
      setConversation(prev => [...prev, { role: 'user', content: userInput }]);
      
      if (userInput.toLowerCase() === 'skip') {
        setConversation(prev => [...prev, { role: 'assistant', content: `Skipped "${currentPlaceholder}".` }]);
      } else {
        setReplacements(prev => ({ ...prev, [currentPlaceholder]: userInput }));
        setConversation(prev => [...prev, { role: 'assistant', content: `Set "${currentPlaceholder}" = "${userInput}".` }]);
      }
      
      const nextIndex = currentPlaceholderIndex + 1;
      if (nextIndex < placeholders.length) {
        setCurrentPlaceholderIndex(nextIndex);
        setConversation(prev => [...prev, { role: 'assistant', content: `Next placeholder: "${placeholders[nextIndex]}" - Enter replacement value or type 'skip':` }]);
      } else {
        generatePreview();
      }
    }
  };

  const generatePreview = () => {
    let result = document;
    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      const regex1 = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      const regex2 = new RegExp(`\\[${placeholder}\\]`, 'g');
      result = result.replace(regex1, replacement).replace(regex2, replacement);
    });
    
    setProcessedDocument(result);
    setShowPreview(true);
    setIsProcessing(false);
    
    setConversation(prev => [...prev, { role: 'assistant', content: 'All placeholders processed! Check the preview below. Type "new" to process another document or "export" to copy the result.' }]);
  };

  const handleNewDocument = () => {
    setDocument('');
    setPlaceholders([]);
    setCurrentPlaceholderIndex(0);
    setReplacements({});
    setProcessedDocument('');
    setIsProcessing(false);
    setShowPreview(false);
    setConversation([
      { role: 'assistant', content: 'Hello! I\'m your Document Placeholder Agent. Please paste your document with placeholders (like {{name}} or [company]) and I\'ll help you replace them.' }
    ]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(processedDocument);
    setConversation(prev => [...prev, { role: 'assistant', content: 'Document copied to clipboard!' }]);
  };

  const conversationElements = conversation.map((message, index) => (
    <div key={index} className={`mb-2 p-2 rounded ${message.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
      <strong className={message.role === 'user' ? 'text-blue-700' : 'text-gray-700'}>
        {message.role === 'user' ? 'You' : 'Agent'}:
      </strong>
      <span className="ml-2">{message.content}</span>
    </div>
  ));

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Document Placeholder Agent</h1>
      
      {/* Document Input Area */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Document with Placeholders:</label>
        <textarea
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          className="w-full h-32 p-2 border rounded resize-none"
          placeholder="Paste your document here with placeholders like {{name}}, [company], etc."
          disabled={isProcessing}
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={processDocument}
            disabled={!document.trim() || isProcessing}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isProcessing ? 'Processing...' : 'Process Document'}
          </button>
          <button
            onClick={handleNewDocument}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            New Document
          </button>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-grow overflow-auto mb-4 border rounded p-2 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Conversation:</h2>
        {conversationElements}
      </div>

      {/* Input Area */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="p-2 border rounded mb-4"
        placeholder={isProcessing ? "Enter replacement value or 'skip'..." : "Type 'process' to start..."}
        onKeyPress={handleUserInput}
        disabled={!document.trim() && !isProcessing}
      />

      {/* Preview Area */}
      {showPreview && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Preview:</h2>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="border rounded p-3 bg-white max-h-48 overflow-auto">
            <pre className="whitespace-pre-wrap">{processedDocument}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceholderAgent;