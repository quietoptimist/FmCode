import React from 'react';

interface SplitPanelProps {
    left: React.ReactNode;
    right: React.ReactNode;
}

export function SplitPanel({ left, right }: SplitPanelProps) {
    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4 w-full">
            <div className="w-full md:w-1/3 h-full overflow-hidden flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
                {left}
            </div>
            <div className="w-full md:w-2/3 h-full overflow-hidden flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
                {right}
            </div>
        </div>
    );
}
