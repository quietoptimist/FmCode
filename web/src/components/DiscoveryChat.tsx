"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, AlertCircle, Sparkles, X } from 'lucide-react';

interface Message {
    role: 'agent' | 'user';
    content: string;
}

interface DiscoveryChatProps {
    onClose: () => void;
    onSummaryUpdate: (summary: string) => void;
    currentSummary: string;
}

export const DiscoveryChat: React.FC<DiscoveryChatProps> = ({
    onClose,
    onSummaryUpdate,
    currentSummary
}) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'agent', content: "Hi! I'm your Financial Architect. Tell me a bit about your business idea, and I'll help you structure it for your model." }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const textBuffer = useRef<string>('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSendText = async () => {
        if (!inputText.trim() || isThinking) return;

        const userMessage = inputText.trim();
        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(newMessages);
        setInputText('');
        setIsThinking(true);
        setErrorMessage(null);
        textBuffer.current = '';

        // Maintain focus
        setTimeout(() => inputRef.current?.focus(), 0);

        try {
            const response = await fetch('/api/discovery/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    currentSummary: currentSummary
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to connect to AI');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;
                handleIncomingTextUpdate(accumulatedText);
            }

        } catch (err: any) {
            console.error("Discovery Chat Error:", err);
            setErrorMessage(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsThinking(false);
            // Ensure focus after streaming ends too
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleIncomingTextUpdate = (fullText: string) => {
        // Extract summary (handle partial blocks for real-time feel)
        let summaryText = '';
        const startTag = '[SUMMARY]';
        const endTag = '[/SUMMARY]';

        const startIndex = fullText.indexOf(startTag);
        if (startIndex !== -1) {
            const contentStart = startIndex + startTag.length;
            const endIndex = fullText.indexOf(endTag, contentStart);

            if (endIndex !== -1) {
                summaryText = fullText.substring(contentStart, endIndex).trim();
            } else {
                summaryText = fullText.substring(contentStart).trim();
            }
        }

        if (summaryText) {
            onSummaryUpdate(summaryText);
        }

        // Clean text for display (remove summary blocks and double newlines)
        // Correctly handle unclosed tags during streaming
        let displayContent = fullText.replace(/\[SUMMARY\][\s\S]*?(\[\/SUMMARY\]|$)/g, '').trim();
        // Replace multiple newlines with a single newline
        displayContent = displayContent.replace(/\n\s*\n/g, '\n');

        setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'agent') {
                const updated = [...prev];
                updated[updated.length - 1] = { ...last, content: displayContent };
                return updated;
            }
            return [...prev, { role: 'agent', content: displayContent }];
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between bg-blue-600 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Discovery Architect</h3>
                        <p className="text-[10px] text-blue-100 uppercase tracking-tighter">Text Assistant</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    title="Close Assistant"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border shadow-sm rounded-tl-none leading-relaxed whitespace-pre-wrap'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 bg-white border-t flex items-center gap-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isThinking ? "Thinking..." : "Type your response..."}
                        disabled={isThinking}
                        className="w-full p-2.5 pr-10 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50/50 resize-none overflow-y-auto max-h-32"
                    />
                    <button
                        onClick={handleSendText}
                        disabled={!inputText.trim() || isThinking}
                        className={`absolute right-1.5 bottom-1.5 p-1.5 rounded-lg transition-all ${inputText.trim() && !isThinking ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-2 bg-gray-50 text-center border-t select-none">
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">
                    AI updates the blueprint below in real-time
                </p>
            </div>
        </div>
    );
};
