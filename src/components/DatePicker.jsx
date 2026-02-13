import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { cn } from "@/src/lib/utils.js"
import { Button } from "@/src/components/ui/button.jsx";
import { Calendar } from "@/src/components/ui/calendar.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover.jsx";
import {useState} from "react";

// Set up based on code from -- ShadCN, “Date Picker,” ui.shadcn.com. https://ui.shadcn.com/docs/components/date-picker (accessed Feb. 27, 2024).
export function DatePicker({ onChange, presetDate }) {
    const [date, setDate] = useState(presetDate || new Date());

    const dateSelect = (selectedDate) => {
        setDate(selectedDate);
        onChange(selectedDate);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"}
                        className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className={"mr-2 h-4 w-4"} />
                    {date ? format(date, "PPP") : <span>Pick a Date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={"w-auto p-0"} align={"start"}>
                <Calendar
                mode={"single"}
                selected={date}
                onSelect={dateSelect}
                initalFocus
                />
            </PopoverContent>
        </Popover>
    )
}