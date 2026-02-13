import {Home, Users, LayoutDashboard} from "lucide-react";

function Sidebar({ isOpen }) {
    return (
        <div className={` ${isOpen ? '' +
            'hidden' : 'w-60'} bg-gray-100 h-full`}>
            <div className={"h-full"}>
                {/*Empty space for top of the sidebar*/}
                <div className={"h-16 px-4"} />

                    {/*Creating three grid rows for each button*/}
                    <nav className={"grid grid-rows-3 gap-2"}>
                        {/*individual nav element */}
                        <div className={"bg-white rounded items-center p-2"}>
                            <a href={"/home"} className={"grid grid-cols-8"}>
                                <Home className={"w-5 h-5 col-span-1"}/>
                                <p className={"font-semibold text-left col-span-7"}>Home</p>
                            </a>
                        </div>

                        <div className={"bg-white rounded items-center p-2"}>
                            <a href={"/socialCircle"} className={"grid grid-cols-8"}>
                                <Users className={"w-5 h-5 col-span-1"}/>
                                <p className={"font-semibold col-span-7"}>Social Circle</p>
                            </a>
                        </div>

                        <div className={"bg-white rounded items-center p-2"}>
                            <a href={"/dashboard"} className={"grid grid-cols-8"}>
                                <LayoutDashboard className={"w-5 h-5 col-span-1"}/>
                                <p className={"font-semibold text-left col-span-7"}>Dashboard</p>
                            </a>
                        </div>
                    </nav>

            </div>
        </div>
    )
}

export default Sidebar;