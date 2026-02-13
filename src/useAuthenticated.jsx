import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase";

// Based on a simplified version of (R. Pozzi, “Manage Firebase authentication, with a single React Hook.,” DEV Community, Jul. 15, 2021. https://dev.to/itsrennyman/manage-firebase-authentication-with-a-single-react-hook-273a (accessed Apr. 12, 2024).)
// && onAuthStateChange from -- Reddit and 'Diligent_Fondant6761', “Authentication with Firebase - How to do it via a hook?,” Reddit. https://www.reddit.com/r/reactnative/comments/xzikif/authentication_with_firebase_how_to_do_it_via_a/ (accessed Dec. 30, 2023).
const useAuthenticated = () => {
    const [user, setUser] = useState(null);

    //Adding a loading state to display a loading spinner on the page when authentication is yet to complete --> fixing an error causing endless redirects
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //Unsubscribe function handled by firebase as a cleanup
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            setLoading(false);
        }, (error) => {
            console.error("Error in authentication: ", error);
        });

        return () =>  {
            unsubscribe();
        }

    }, []);


    return { user, loading, isAuthenticated: !!user };
};

export default useAuthenticated;
