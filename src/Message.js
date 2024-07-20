import React from 'react';
import { Text, Avatar, HStack, Box, Image, Link } from '@chakra-ui/react';

const Message = ({ text, uri, user = "other", fileURL }) => {
  return (
    <HStack
      alignSelf={user === "me" ? "flex-end" : "flex-start"}
      borderRadius={"base"}
      paddingY={2}
      paddingX={user === "me" ? 4 : 2}
      bg={user === "me" ? "blue.50" : "red.50"}
    >
      {user === "other" && <Avatar src={uri} />}
      <Box>
        <Text>{text}</Text>
        {fileURL && (
          <Link href={fileURL} isExternal>
            <Image src={fileURL} boxSize="100px" objectFit="cover" />
          </Link>
        )}
      </Box>
      {user === "me" && <Avatar src={uri} />}
    </HStack>
  );
};

export default Message;
