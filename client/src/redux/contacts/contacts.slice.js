import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
    contacts: {},
}

export const getContacts = createAsyncThunk('contacts/getContacts', async (id) => {
    try {
        const response = await fetch(`http://localhost:3000/api/v1/user/contacts/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (err) {
        throw err;
    }
});

export const newContact = createAsyncThunk('contacts/newContact', async (data) => {
    try {
        const response = await fetch(`http://localhost:3000/api/v1/user/newContact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            const data = await response.json();
            throw new Error(data.message);
        }
    } catch (err) {
        throw err;
    }
});

const contactsSlice = createSlice({
    name: 'contacts',
    initialState,
    reducers: {
        roomJoinUpdate: (state, action) => {
            const contact = state.contacts[action.payload.roomId];
            if (contact) {
                // Create a new object for messages
                const readMessages = {};
                const unreadMessages = {};

                console.log(action.payload);

                // Add new messages to the new object
                action.payload.messages.readMessages.forEach(message => {
                    readMessages[message._id] = message;
                });
                action.payload.messages.unreadMessages.forEach(message => {
                    unreadMessages[message._id] = message;
                });

                // Update contact's room messages in one go
                contact.room.readMessages = readMessages;
                contact.room.unreadMessages = unreadMessages;
            }
        },
        addOneReadMessage: (state, action) => {
            const contact = state.contacts[action.payload.message.room];
            if (contact) {
                if (contact.room.unreadMessages) {
                    const updatedMessages = {};
                    if (Object.values(contact.room.unreadMessages).length > 0) {
                        Object.values(contact.room.unreadMessages).forEach(message => {
                            updatedMessages[message._id] = message;
                            contact.room.readMessagesCount += 1;
                        });
                    }
                    // console.log(updatedMessages, contact.room.readMessages);
                    contact.room.unreadMessages = [];
                    contact.room.unreadMessagesCount = 0;
                    contact.room.readMessages = { ...contact.room.readMessages, ...updatedMessages };

                    if (contact.room.unreadMessageBannerHeight)
                        contact.room.unreadMessageBannerHeight += 1;
                }
                contact.room.readMessages = { ...contact.room.readMessages, [action.payload.message._id]: action.payload.message };
                contact.room.readMessagesCount += 1;
                contact.room.lastMessage = action.payload.message;
            }
        },
        addOneUnreadMessage: (state, action) => {
            const contact = state.contacts[action.payload.message.room];
            if (contact) {
                console.log(action.payload.message.sender === action.payload.userId, action.payload.message.sender, action.payload.userId)
                if (action.payload.message.sender === action.payload.userId)
                    contact.room.unreadMessages = { ...contact.room.unreadMessages, [action.payload.message._id]: action.payload.message };
                contact.room.unreadMessagesCount += 1;
                contact.room.lastMessage = action.payload.message;
                contact.room.unreadMessageSender = action.payload.message.sender;
                if (contact.room.unreadMessageBannerHeight)
                    contact.room.unreadMessageBannerHeight += 1;
            }
        },
        updateBulkJoin: (state, action) => {
            const contact = state.contacts[action.payload.roomId];
            if (contact) {
                contact.room.lastMessage = action.payload.message;
                contact.room.unreadMessagesCount += 1;
                contact.room.unreadMessages = { ...contact.room.unreadMessages, [action.payload.message._id]: action.payload.message };
                contact.room.unreadMessageSender = action.payload.message.sender;
            }
        },
        markMessagesRead: (state, action) => {
            const contact = state.contacts[action.payload.roomId];
            const updatedMessages = {};
            if (contact) {
                if (contact.room.unreadMessages) {
                    Object.values(contact.room.unreadMessages).forEach(message => {
                        updatedMessages[message._id] = message;
                        contact.room.readMessagesCount += 1;
                    });
                }
                // console.log(updatedMessages, contact.room.readMessages);
                contact.room.unreadMessages = [];
                contact.room.unreadMessageBannerHeight = contact.room.unreadMessagesCount;
                contact.room.unreadMessagesCount = 0;
                contact.room.readMessages = { ...contact.room.readMessages, ...updatedMessages };
                // console.log(contact.room.readMessages);
            }
        },
        deleteMessage: (state, action) => {
            const contact = state.contacts[action.payload.roomId];
            if (contact) {
                const readMessages = { ...contact.room.readMessages };
                const unreadMessages = { ...contact.room.unreadMessages };

                if (readMessages[action.payload.messageId]) {
                    const message = readMessages[action.payload.messageId];
                    message.content = "This message has been deleted";
                    message.status = "deleted";
                    readMessages[action.payload.messageId] = message;
                }
                else if (unreadMessages[action.payload.messageId]) {
                    const message = unreadMessages[action.payload.messageId];
                    message.content = "This message has been deleted";
                    message.status = "deleted";
                    unreadMessages[action.payload.messageId] = message;
                }
                // contact.room.readMessages = readMessages;
                // contact.room.unreadMessages = unreadMessages;
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getContacts.fulfilled, (state, action) => {
            // Create a new object to hold the updated contacts
            const newContacts = { ...state.contacts };

            // Populate the new object with the contacts from the action payload
            action.payload.data.contacts.forEach(contact => {
                newContacts[contact.room._id] = contact;
            });

            // Assign the new object to state.contacts
            state.contacts = newContacts;

            console.log(action.payload.data.contacts);
        });

        // builder.addCase(getContacts.fulfilled, (state, action) => {
        //     action.payload.data.contacts.forEach(contact => {
        //         state.contacts = { ...state.contacts, [contact.room._id]: contact };
        //     });
        //     console.log(action.payload.data.contacts);
        //     // state.contacts = action.payload.data.contacts;
        // });
        builder.addCase(newContact.fulfilled, (state, action) => {
            state.contacts = { ...state.contacts, [action.payload.data.contact.room._id]: action.payload.data.contact };
            // state.contacts.push(action.payload.data.contact);
        })
    }
});

export const { deleteMessage, updateBulkJoin, markMessagesRead, roomJoinUpdate, addOneReadMessage, addOneUnreadMessage } = contactsSlice.actions;

export default contactsSlice.reducer;