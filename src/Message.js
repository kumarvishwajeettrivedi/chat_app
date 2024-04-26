import React from 'react'
import {Text,Avatar,HStack} from '@chakra-ui/react'

const Message = ({text,uri,user="other"}) => {
  return (
 
   <HStack alignSelf={user==="me"?"flex-end":"flex-start"} borderRadius={"base"} paddingY={2} paddingX={user==="me"?4:2} bg={ user==="me"?"blue.50":"red.50"}>
   {
    user==="other"&&<Avatar src={uri} />
   }
   <Text>{text}</Text>
   {

       user==="me"&&<Avatar src={uri} />
   }
    </HStack>
  )
}

export default Message