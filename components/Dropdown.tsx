import React, { useState, useEffect } from 'react';
import { Select, SelectItem, SelectTrigger, SelectContent } from '@/components/ui/select';  // Adjust this path according to your project structure

const Dropdown = ({ label, options, value, onChange }: DropdownProps ) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Ensure the component is only marked as mounted on the client-side
        setMounted(true);
    }, []);

    return (
        <div className="form-item flex w-full flex-col">
            <label className="form-label">{label}</label>
            {mounted ? (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
                        <button className="text-gray-700">
                            {value ? value : ` ${label.toWellFormed()}`}
                        </button>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="placeholder" disabled>
                            {` ${label.toLocaleUpperCase()}`}
                        </SelectItem>
                        {options.map((option) => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <div className="text-gray-700">{`Loading...`}</div> // or placeholder content
            )}
        </div>
    );
};

export default Dropdown;
