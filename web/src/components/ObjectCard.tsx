import React from 'react';

interface ObjectCardProps {
    object: any;
}

export function ObjectCard({ object }: ObjectCardProps) {
    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm text-black">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{object.name}</h3>
                <span className="text-xs text-gray-500">{object.fnName}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{object.comment}</p>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                {object.name} = {object.fnName}({object.args.map((a: any) => a.raw || a.name).join(', ')})
            </div>
        </div>
    );
}
