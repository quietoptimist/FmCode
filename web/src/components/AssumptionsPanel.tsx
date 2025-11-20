import React from 'react';

interface AssumptionsPanelProps {
    assumptions: any;
    onChange: (objName: string, type: 'object' | 'output', aliasOrName: string, fieldName: string, value: any) => void;
}

export function AssumptionsPanel({ assumptions, onChange }: AssumptionsPanelProps) {
    console.log("AssumptionsPanel rendered with:", assumptions);
    if (!assumptions) return <div className="p-4 text-gray-400">No assumptions loaded. Parse the model to generate assumptions.</div>;

    return (
        <div className="flex-1 overflow-auto p-6 space-y-8 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">Assumptions</h2>
            {Object.entries(assumptions).map(([objName, objAss]: [string, any]) => (
                <div key={objName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
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
            ))}
        </div>
    );
}

function AssumptionInput({ label, field, onChange }: { label: string, field: any, onChange: (val: any) => void }) {
    // Determine input type based on supports
    // For now, we prioritize: Annual -> Single
    // If annual is supported, show 5 inputs (hardcoded for 5 years for now)

    const isAnnual = field.supports?.annual;
    const value = field.raw.single; // Default to single

    // TODO: Handle annual array in raw.annual if we implement it fully

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
            <div className="flex items-center gap-2">
                {/* Currently we only edit 'single' value. 
                    To support annual, we would need to pass an array and update 'raw.annual'.
                    But updateAssumption currently updates 'raw.single'.
                    Let's stick to single for now but make it look good.
                */}
                <input
                    type="number"
                    className="w-full max-w-[200px] p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={value ?? ''}
                    onChange={(e) => {
                        console.log("Input changed:", e.target.value);
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
