import { db } from './firebase'; // Ensure 'db' is correctly imported
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

// Define addUserToGroup function
export const addUserToGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, "Groups", groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
    });
    console.log("User added to group with ID: ", groupId);
  } catch (error) {
    console.error("Error adding user to group: ", error);
  }
};

// Define createGroup function
export const createGroup = async (groupName, user) => {
  try {
    const groupRef = doc(db, "Groups", doc(collection(db, "Groups")).id); // Generate a unique ID
    await setDoc(groupRef, {
      name: groupName,
      createdAt: serverTimestamp(),
      members: [user.uid],
    });
    console.log("Group created with ID: ", groupRef.id);
  } catch (error) {
    console.error("Error creating group: ", error);
  }
};

// Define removeUserFromGroup function
export const removeUserFromGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, "Groups", groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
    });
    console.log("User removed from group with ID: ", groupId);
  } catch (error) {
    console.error("Error removing user from group: ", error);
  }
};

// Define deleteGroup function
export const deleteGroup = async (groupId) => {
  try {
    const groupRef = doc(db, "Groups", groupId);
    await deleteDoc(groupRef);
    console.log("Group deleted with ID: ", groupId);
  } catch (error) {
    console.error("Error deleting group: ", error);
  }
};
