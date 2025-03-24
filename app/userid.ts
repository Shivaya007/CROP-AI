import { useEffect, useState } from "react";
import { auth } from "./firebase"; // Import Firebase auth instance
import { onAuthStateChanged } from "firebase/auth";

const useUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // ✅ Get user ID
      } else {
        setUserId(null); // No user is signed in
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return userId;
};

export default useUserId;
