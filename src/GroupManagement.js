import React, { useState } from 'react';
import { Button, Input, VStack, HStack } from '@chakra-ui/react';
import { createGroup, addUserToGroup } from './groupService'; // Ensure the import is correct
import { getAuth } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

const GroupManagement = () => {
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [addGroupId, setAddGroupId] = useState(""); // For adding users to an existing group

  const handleCreateGroup = async () => {
    const user = auth.currentUser;
    if (user) {
      await createGroup(groupId, groupName, user);
      setGroupId("");
      setGroupName("");
    }
  };

  const handleAddUserToGroup = async () => {
    // Here you would typically find the userId by their email
    // For simplicity, we'll assume the userId is found and is the same as the email for now
    await addUserToGroup(addGroupId, userEmail);
    setUserEmail("");
    setAddGroupId("");
  };

  return (
    <VStack spacing={4}>
      <HStack>
        <Input
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Group ID"
        />
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
        />
        <Button onClick={handleCreateGroup} colorScheme="blue">Create Group</Button>
      </HStack>
      <HStack>
        <Input
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="User Email"
        />
        <Input
          value={addGroupId}
          onChange={(e) => setAddGroupId(e.target.value)}
          placeholder="Group ID"
        />
        <Button onClick={handleAddUserToGroup} colorScheme="green">Add User to Group</Button>
      </HStack>
    </VStack>
  );
};

export default GroupManagement;
