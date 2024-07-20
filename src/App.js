import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  VStack,
  Button,
  HStack,
  Input,
  useBreakpointValue,
  IconButton,
  Text,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  where,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";
import Message from "./Message";
import EmojiPicker from "emoji-picker-react";
import { FiSend, FiPaperclip, FiMoreVertical } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const loginHandler = () => {
  const authentication = new GoogleAuthProvider();
  signInWithPopup(auth, authentication);
};

const signoutHandler = () => {
  signOut(auth);
};

function App() {
  const [user, setUser] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [fileURL, setFileURL] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [contacts, setContacts] = useState([]);

  const q = query(collection(db, "Message"), orderBy("createdAt", "asc"));
  const sendRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeFromMessages = onSnapshot(q, (snap) =>
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return {
            id,
            ...item.data(),
          };
        })
      )
    );

    const unsubscribeFromGroups = onSnapshot(
      collection(db, "Groups"),
      (snap) => {
        setGroups(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      }
    );

    const unsubscribeFromUsers = onSnapshot(collection(db, "Users"), (snap) => {
      setContacts(
        snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    });

    return () => {
      unsubscribe();
      unsubscribeFromMessages();
      unsubscribeFromGroups();
      unsubscribeFromUsers();
    };
  }, [q]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `files/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        setFileURL(downloadURL);
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
        fileURL: fileURL || null,
        groupId: selectedGroup,
        createdAt: serverTimestamp(),
      });

      setInputMessage("");
      setFileURL(null);
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
    } catch (error) {
      console.error("Error creating group: ", error);
    }
  };

  const addUserToGroup = async (groupId, email, name) => {
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

      // Send an email with the access link to the new member
      // (Email sending code here)

      setUserEmail("");
      setUserName("");
    } catch (error) {
      console.error("Error adding user to group: ", error);
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await updateDoc(doc(db, "Groups", groupId), {
        members: [],
      });

      // Delete all messages associated with the group
      const messagesRef = collection(db, "Message");
      const messagesQuery = query(messagesRef, where("groupId", "==", groupId));
      const messagesSnap = await getDocs(messagesQuery);
      messagesSnap.forEach(async (msgDoc) => {
        await updateDoc(doc(db, "Message", msgDoc.id), {
          text: "[deleted]",
        });
      });
    } catch (error) {
      console.error("Error deleting group: ", error);
    }
  };

  const onEmojiClick = (event, emojiObject) => {
    setInputMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowPicker(false);
  };

  const sidebarWidth = useBreakpointValue({ base: "full", md: "20%" });
  const chatPaddingLeft = useBreakpointValue({ base: "0", md: "20%" });

  return (
    <Box bg={"red.50"} h={"90vh"}>
      <Box position="fixed" w={sidebarWidth} h="full" bg="gray.100" p={4}>
        <VStack spacing={4} align="stretch">
          <Input
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Button onClick={handleCreateGroup} colorScheme="blue">
            Create Group
          </Button>

          <VStack spacing={2} align="stretch">
            {groups.map((group) => (
              <HStack
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                w="full"
                p={2}
                borderRadius="md"
                bg={selectedGroup === group.id ? "teal.200" : "gray.200"}
                _hover={{ bg: "teal.100" }}
                justifyContent="space-between"
                cursor="pointer"
              >
                <Text>{group.name}</Text>
                <Image
                  src={group.image || "https://via.placeholder.com/50"}
                  borderRadius="full"
                  boxSize="40px"
                  objectFit="cover"
                  alt={group.name}
                />
                <Menu>
                  <MenuButton as={IconButton} icon={<FiMoreVertical />} />
                  <MenuList>
                    <MenuItem
                      onClick={() =>
                        addUserToGroup(group.id, userEmail, userName)
                      }
                    >
                      Add Member
                    </MenuItem>
                    <MenuItem onClick={() => deleteGroup(group.id)}>
                      Delete Group
                    </MenuItem>
                    <MenuItem>Delete Chats</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            ))}
          </VStack>

          <VStack spacing={2} align="stretch">
            <Text fontSize="lg" fontWeight="bold">
              Contacts
            </Text>
            {contacts.map((contact) => (
              <HStack
                key={contact.id}
                w="full"
                p={2}
                borderRadius="md"
                bg="gray.200"
              >
                <Text>{contact.name}</Text>
                <Image
                  src={contact.photoURL || "https://via.placeholder.com/50"}
                  borderRadius="full"
                  boxSize="40px"
                  objectFit="cover"
                  alt={contact.name}
                />
              </HStack>
            ))}
          </VStack>

          <Button
            onClick={signoutHandler}
            colorScheme="red"
            position="absolute"
            bottom={4}
            left={4}
            right={4}
          >
            LOGOUT
          </Button>
        </VStack>
      </Box>

      <Container
        h={"90vh"}
        paddingLeft={chatPaddingLeft}
        bg={"white"}
        padding={4}
      >
        {user ? (
          <>
            {selectedGroup && (
              <HStack
                w="full"
                p={4}
                borderBottom="1px solid"
                borderColor="gray.300"
                alignItems="center"
                justifyContent="space-between"
              >
                <HStack alignItems="center">
                  <Image
                    src={
                      groups.find((group) => group.id === selectedGroup)
                        ?.image || "https://via.placeholder.com/50"
                    }
                    borderRadius="full"
                    boxSize="50px"
                    objectFit="cover"
                    alt="Group"
                  />
                  <Text fontSize="xl">
                    {groups.find((group) => group.id === selectedGroup)?.name}
                  </Text>
                </HStack>
                <Menu>
                  <MenuButton as={IconButton} icon={<FiMoreVertical />} />
                  <MenuList>
                    <MenuItem onClick={() => setSelectedGroup(null)}>
                      Edit Group Name
                    </MenuItem>
                    <MenuItem
                      onClick={() =>
                        addUserToGroup(selectedGroup, userEmail, userName)
                      }
                    >
                      Add Member
                    </MenuItem>
                    <MenuItem onClick={() => deleteGroup(selectedGroup)}>
                      Delete Group
                    </MenuItem>
                    <MenuItem>Delete Chats</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            )}

            <VStack
              h={"full"}
              w={"full"}
              padding={2}
              overflow={"auto"}
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {messages
                .filter(
                  (msg) =>
                    selectedGroup === null || msg.groupId === selectedGroup
                )
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
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <IconButton
                  icon={<FiPaperclip />}
                  onClick={() => fileInputRef.current.click()}
                  variant="outline"
                  aria-label="Attach file"
                />
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter Message..."
                  variant="outline"
                />
                <IconButton
                  icon={<FiSend />}
                  type="submit"
                  colorScheme="blue"
                  aria-label="Send message"
                />
                <Button onClick={() => setShowPicker(!showPicker)}>😀</Button>
                {showPicker && (
                  <Box
                    position="absolute"
                    bottom="60px"
                    right="10px"
                    zIndex="1000"
                  >
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </Box>
                )}
              </HStack>
            </form>
          </>
        ) : (
          <VStack w={"full"} justifyContent={"center"} h={"100vh"}>
            <Button onClick={loginHandler} colorScheme="purple">
              Sign in with Google
            </Button>
          </VStack>
        )}
      </Container>
    </Box>
  );
}

export default App;
