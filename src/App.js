import React, { useEffect, useRef, useState } from "react";
import { Box, Container, VStack, Button, HStack, Input } from "@chakra-ui/react";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "./firebase";
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot,query,orderBy} from "firebase/firestore";//messages are not sorted to make it sorted we neet to add query and orderBy from firebase
import Message from "./Message";

const auth = getAuth(app);
const db = getFirestore(app);


const loginhandler = () => {
  const authentication = new GoogleAuthProvider(auth);
  signInWithPopup(auth, authentication);
}

const signout = () => {
  signOut(auth);
}

function App() {
  const [user, setuser] = useState(false);
  const [inputMessage, setInputMessage] = useState(""); //'inputMessage'
  const [messages, setMessages] = useState([]); // Store the fetched messages in 'messages'
  const q=query(collection(db,"Message"),orderBy("createdAt","asc"));//fetching data and storing in ascending order

  //for scrollbar 
  const sendreff=useRef(null);


  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setuser(data);
    });

    // Fetch messages from Firestore using onSnapshot  
   // const messageRef = collection(db, "Message");

    const unsuscribeformessage=onSnapshot(q,(snap)=>setMessages(snap.docs.map((item)=>{//add id and send messages 
      const id=item.id;
      return{
        id,...item.data()
      }
    })));
    ///above code is crucial to learn

    return () => {
      unsubscribe();
      unsuscribeformessage();//helps to get image from browser uri
    };

  }, []);

  const submitHandler = (e) => {
    e.preventDefault();
    try {
      addDoc(collection(db, "Message"), {
        text: inputMessage,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });

      setInputMessage(""); // Clear the input field after submitting
      sendreff.current.scrollIntoView({ behavior: "smooth"});//making scrollbevaiout=r smooth
    } catch (error) {
      alert("Error");
    }
  }

  return (
    <Box bg={"red.50"} h={"90vh"}>
      {
        user ? (
          <Container h={"90vh"} bg={"white"} padding={4}>
            <VStack bg={"telegram.200"}>
              <Button onClick={signout} colorScheme="red" w={"full"}>LOGOUT</Button>
            </VStack>

            <VStack h={"full"} w={"full"} padding={2} overflow={"auto"} css={{"&::-webkit-scrollbar":{display:"none",},}}>
              {
                messages.map((item) => (
                  <Message key={item.id} // Use 'id' instead of 'uri' for unique key
                    text={item.text}
                    uri={item.uri}
                    user={item.uid === user.uid ? "me" : "other"} />
                ))
              }
              <div ref={sendreff}></div>
            </VStack>

            <form>
              <HStack>
                <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="EnterMessage..." />
                <Button onClick={submitHandler} type="submit" colorScheme="blue">SEND</Button>
              </HStack>
            </form>
          </Container>
        ) : (
          <VStack w={"full"} justifyContent={"center"} h={"100vh"}>
            <Button onClick={loginhandler} colorScheme="purple">sign in with google</Button>
          </VStack>
        )
      }
    </Box>
  );
}

export default App;



//to remove scrollbar we use useRef property along with  a css property scrollIntoView /
//add it just after when next message is about to send