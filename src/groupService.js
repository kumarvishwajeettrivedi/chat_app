import { collection, addDoc, setDoc, doc, updateDoc, arrayUnion, arrayRemove, getDocs, getDoc, query, where, deleteDoc } from "firebase/firestore";
import { db } from "./firebase"; // Ensure correct import of db

// Function to create a group
export const createGroup = async (groupName, userId) => {
  const groupRef = doc(collection(db, "Groups"));
  await setDoc(groupRef, {
    name: groupName,
    createdAt: new Date(),
    members: [userId],
    owner: userId,
  });
  return groupRef.id;
};

// Function to send a request to add a user to a group
export const addUserToGroup = async (groupId, email) => {
  const userRef = query(collection(db, "Users"), where("email", "==", email));
  const userSnap = await getDocs(userRef);
  if (userSnap.empty) {
    throw new Error("User not found");
  }
  const userId = userSnap.docs[0].id;

  await addDoc(collection(db, "GroupRequests"), {
    groupId,
    email,
    status: "Pending",
  });
};

// Function to accept a group request
export const acceptGroupRequest = async (requestId) => {
  const requestRef = doc(db, "GroupRequests", requestId);
  const requestSnap = await getDoc(requestRef);
  if (requestSnap.exists()) {
    const { groupId, email } = requestSnap.data();
    const userRef = query(collection(db, "Users"), where("email", "==", email));
    const userSnap = await getDocs(userRef);
    if (!userSnap.empty) {
      const userId = userSnap.docs[0].id;
      await updateDoc(doc(db, "Groups", groupId), {
        members: arrayUnion(userId),
      });
      await updateDoc(requestRef, { status: "Accepted" });
    }
  }
};

// Function to remove a user from a group
export const removeUserFromGroup = async (groupId, userId, ownerId) => {
  const groupRef = doc(db, "Groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists() && groupSnap.data().owner === ownerId) {
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
    });
  }
};

// Function to delete a group
export const deleteGroup = async (groupId, ownerId) => {
  const groupRef = doc(db, "Groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists() && groupSnap.data().owner === ownerId) {
    await deleteDoc(groupRef);
  }
};
