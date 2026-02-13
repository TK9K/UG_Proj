import {Button} from "@/src/components/ui/button.jsx";
import {DropdownMenu, DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuItem} from "@/src/components/ui/dropdown-menu.jsx";
import { HamburgerMenuIcon} from "@radix-ui/react-icons";
import {Avatar, AvatarFallback} from "@radix-ui/react-avatar";
import {auth} from "@/Firebase.jsx";
import {Link, useNavigate} from "react-router-dom";
import {signOut} from "firebase/auth";
import {getInitials} from "@/components/Utility.jsx";

function Topbar( {currentPage, onToggleSidebar} ) {

    const initials = getInitials(auth.currentUser.displayName);

    const navigate = useNavigate();
    // Firebase signout function based on -- Google Firebase, “Authenticate with Firebase using Password-Based Accounts using Javascript,” Firebase. https://firebase.google.com/docs/auth/web/password-auth (accessed Apr. 13, 2024).
    const signOutFunction = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) {
            console.error("Error signing out:", error.message);
        }
    }

    return (
        <div className="w-full">
            <div className="border-b flex h-14 items-center px-4">
                <Button className="mr-4 bg-slate-950" onClick={onToggleSidebar} size="icon">
                    <HamburgerMenuIcon className={"h-4 w-4"} />
                </Button>

                {/*Code to render the current page name*/}
                <h1 className="font-semibold text-lg mr-1">{currentPage}</h1>

                <div className="flex items-center gap-4 ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="h-8 w-8 rounded-full" size="icon" variant="outline">
                                <Avatar>
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className={"w-56"}>
                            <DropdownMenuLabel>Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to={"/profile"}>Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOutFunction}>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </div>
    )
}

export default Topbar;