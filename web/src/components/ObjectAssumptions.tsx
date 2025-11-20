import React from 'react';

interface ObjectAssumptionsProps {
    objName: string;
    objAss: any;
    onChange: (objName: string, type: 'object' | 'output', aliasOrName: string, fieldName: string, value: any) => void;
}

export function ObjectAssumptions({ objName, objAss, onChange }: ObjectAssumptionsProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 h-fit">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {objName}
            </h3>

            {/* Object Level Assumptions */}
            {objAss.object && Object.keys(objAss.object).length > 0 && (
                <div className="space-y-3 pl-4 border-l-2 border-blue-100">
                    {Object.entries(objAss.object).map(([fieldName, field]: [string, any]) => (
                        <AssumptionInput
                            key={`obj-${fieldName}`}
                            label={field.label}
                            field={field}
                            onChange={(val) => onChange(objName, 'object', fieldName, fieldName, val)}
                        />
                    ))}
                </div>
            )}

            {/* Output Level Assumptions */}
            {objAss.outputs && Object.keys(objAss.outputs).length > 0 && (
                <div className="space-y-6 mt-4">
                    {Object.entries(objAss.outputs).map(([alias, outAss]: [string, any]) => (
                        <div key={alias} className="pl-4 border-l-2 border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">{alias}</h4>
                            <div className="space-y-3">
                                {Object.entries(outAss).map(([fieldName, field]: [string, any]) => (
                                    <AssumptionInput
                                        key={`out-${alias}-${fieldName}`}
                                        label={field.label}
                                        field={field}
                                        onChange={(val) => onChange(objName, 'output', alias, fieldName, val)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AssumptionInput({ label, field, onChange }: { label: string, field: any, onChange: (val: any) => void }) {
    const isAnnual = field.supports?.annual;
    const value = field.raw.single; // Default to single

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    className="w-full max-w-[200px] p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={value ?? ''}
                    onChange={(e) => {
                        onChange(parseFloat(e.target.value));
                    }}
                    placeholder="Value..."
                />
                <span className="text-xs text-gray-400 italic">
                    {isAnnual ? '(Applied annually)' : '(Constant)'}
                </span>
            </div>
        </div>
    );
}
