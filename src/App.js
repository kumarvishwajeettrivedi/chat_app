import React, { useEffect, useRef, useState } from "react";
import { Box, Container, VStack, Button, HStack, Input, Stack, Text, Image } from "@chakra-ui/react";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, doc, setDoc, updateDoc, arrayUnion, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from "./firebase";
import Message from "./Message";
import EmojiPicker from 'emoji-picker-react'; // Correct import for emoji-picker-react

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const loginhandler = () => {
  const authentication = new GoogleAuthProvider();
  signInWithPopup(auth, authentication);
}

const signout = () => {
  signOut(auth);
}

function App() {
  const [user, setUser] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const q = query(collection(db, "Message"), orderBy("createdAt", "asc"));
  const sendRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeFromMessages = onSnapshot(q, (snap) => setMessages(snap.docs.map((item) => {
      const id = item.id;
      return {
        id, ...item.data()
      };
    })));

    const unsubscribeFromGroups = onSnapshot(collection(db, "Groups"), (snap) => {
      setGroups(snap.docs.map((item) => ({
        id: item.id,
        ...item.data()
      })));
    });

    return () => {
      unsubscribe();
      unsubscribeFromMessages();
      unsubscribeFromGroups();
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `files/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setFile(downloadURL);
      } catch (error) {
        console.error("Error uploading file: ", error);
      }
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "Message"), {
        text: inputMessage,
        uid: user.uid,
        uri: user.photoURL,
        fileURL: file || null,
        createdAt: serverTimestamp(),
      });

      setInputMessage("");
      setFile(null);
      fileInputRef.current.value = null;
      sendRef.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert("Error");
    }
  };

  const handleCreateGroup = async () => {
    try {
      const newGroupId = doc(collection(db, "Groups")).id;
      await setDoc(doc(db, "Groups", newGroupId), {
        name: groupName,
        createdAt: serverTimestamp(),
        members: [user.uid],
      });
      setGroupName("");
      setGroupMembers([]);
    } catch (error) {
      console.error("Error creating group: ", error);
    }
  };

  const addUserToGroup = async (groupId, email) => {
    const userRef = query(collection(db, "Users"), where("email", "==", email));
    const userSnap = await getDocs(userRef);
    if (userSnap.empty) {
      console.error("User not found");
      return;
    }
    const userId = userSnap.docs[0].id;

    try {
      const groupRef = doc(db, "Groups", groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
      });
    } catch (error) {
      console.error("Error adding user to group: ", error);
    }
  };

  const onEmojiClick = (event, emojiObject) => {
    setInputMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowPicker(false);
  };

  return (
    <Box bg={"red.50"} h={"90vh"}>
      <Box position="fixed" w="20%" h="full" bg="gray.100" p={4}>
        <VStack spacing={4} align="stretch">
          <Input
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button onClick={handleCreateGroup} colorScheme="blue">Create Group</Button>

          <Stack spacing={3}>
            <Input
              placeholder="Group ID"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            />
            <Input
              placeholder="User Email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
            <Button onClick={() => addUserToGroup(groupId, userEmail)} colorScheme="green">Add User</Button>
          </Stack>

          <VStack spacing={2} align="stretch">
            {groups.map((group) => (
              <Button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                colorScheme="teal"
                variant={selectedGroup === group.id ? "solid" : "outline"}
              >
                {group.name}
              </Button>
            ))}
          </VStack>
        </VStack>
      </Box>

      <Container h={"90vh"} paddingLeft={"20%"} bg={"white"} padding={4}>
        {user ? (
          <>
            <VStack bg={"telegram.200"}>
              <Button onClick={signout} colorScheme="red" w={"full"}>LOGOUT</Button>
            </VStack>

            <VStack h={"full"} w={"full"} padding={2} overflow={"auto"} css={{ "&::-webkit-scrollbar": { display: "none", }, }}>
              {messages
                .filter(msg => selectedGroup === null || msg.groupId === selectedGroup)
                .map((item) => (
                  <Message
                    key={item.id}
                    text={item.text}
                    uri={item.uri}
                    fileURL={item.fileURL}
                    user={item.uid === user.uid ? "me" : "other"}
                  />
                ))}
              <div ref={sendRef}></div>
            </VStack>

            <form onSubmit={submitHandler}>
              <HStack spacing={2} alignItems="center">
                <Input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileChange}
                />
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter Message..."
                  variant="outline"
                />
                <Button type="submit" colorScheme="blue">SEND</Button>
                <Button onClick={() => setShowPicker(!showPicker)}>😀</Button>
                {showPicker && <EmojiPicker onEmojiClick={onEmojiClick} />}
              </HStack>
            </form>
          </>
        ) : (
          <VStack w={"full"} justifyContent={"center"} h={"100vh"}>
            <Button onClick={loginhandler} colorScheme="purple">Sign in with Google</Button>
          </VStack>
        )}
      </Container>
    </Box>
  );
}

export default App;
