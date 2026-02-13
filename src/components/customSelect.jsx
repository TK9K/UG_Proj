import makeAnimated from "react-select/animated";
import Select from "react-select";
import {cn} from "@/src/lib/utils.js";

//Information to achieve custom CSS came from the React-Select documentation/website (React-Select and J. Watson, “React-Select,” React-Select. https://react-select.com/styles (accessed Apr. 26, 2024).)
const CustomSelect = ({options, value, onChange, placeholder, menuPlacement}) => {
    const animated = makeAnimated();
    //Replicating ShadCN/UI Components styles across the rest of the site
    const customStyles = {
        container: (provided) => ({
            ...provided,
            minHeight: "36px",
            height: "36px",
        }),

        control: (provided) => ({
            ...provided,
            textAlign: "left",
            borderRadius: "6px",
            borderColor: "214.3 31.8% 91.4%;",
            width: "100%",
            maxHeight: "50%",
        }),

        singleValue: (provided) => ({
            ...provided,
            textAlign: "left",
            borderRadius: "6px",
        }),
        menu: (provided) => ({
            ...provided,
            textAlign: "left",
            borderRadius: "6px",
        }),
        option: (provided , state) => ({
            ...provided,
            //isDisabled? is used to style 'group names'
            color: state.isDisabled ? '#757575' : provided.color,
            backgroundColor: state.isDisabled ? '#f1f1f1' : provided.background,
            fontWeight: state.isDisabled ? 'bold' : provided.fontWeight,
            borderRadius: "10px",
            width: state.isDisabled ? "96.5%" : "94.7%",
            marginLeft: state.isDisabled ? "10px" : "20px",
            marginBottom: "5px",
        }),
    };

    return (
        <Select
            closeMenuOnSelect={false}
            components={animated}
            value={value}
            options={options}
            //Classname taken from the styling of the default shadcn select component -- src/src/components/ui/select.jsx
            className={cn(
                "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
            )}
            styles={customStyles}
            onChange={onChange}
            placeholder={placeholder}
            isMulti
            menuPlacement={menuPlacement}/>
    )
}

export default CustomSelect;