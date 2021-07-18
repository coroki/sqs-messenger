import { Button } from '@material-ui/core';
import React, { useCallback, useState } from 'react';
import { MessageUtils } from '../utils/message.utils';
import { SqsMessage } from './app.component';
import { Message } from './message.component';

type Props = {
    /**
     * The initial messages to present.
     */
    initialMessages: SqsMessage[];

    /**
     * Emitted whent the user chooses to send an SQS message to a queue.
     *
     * @param message    The sent message.
     * @returns          A promise that resolves to a boolean indicating success of the send action.
     */
    onSendMessage: (message: SqsMessage) => Promise<boolean>;
};

/**
 * Renders an editable list of POSTable SQS messages.
 */
export const Messages: React.FC<Props> = (props) => {
    const [messages, setMessages] = useState<SqsMessage[]>(props.initialMessages);

    const sendMessage = useCallback(
        async (messageId: string, sentMessage: SqsMessage): Promise<boolean> => {
            const setErrors = (newErrors: string[]) => {
                setMessages(
                    messages.map((message) => {
                        if (message.id === messageId) {
                            return {
                                ...message,
                                errors: newErrors,
                            };
                        }
                        return message;
                    })
                );
            };

            const errors = MessageUtils.validateMessage(sentMessage);

            if (errors) {
                setErrors(errors);
                return false;
            }

            try {
                return await props.onSendMessage(sentMessage);
            } catch (error) {
                setErrors([error]);
                return false;
            }
        },
        [messages]
    );

    const addMessage = useCallback(() => {
        setMessages([
            ...messages,
            {
                id: MessageUtils.generateRandomId(),
                body: '',
                attributes: [],
            },
        ]);
    }, [messages]);

    const updateMessage = useCallback(
        (messageId: string, newMessage: SqsMessage) => {
            setMessages(messages.map((message) => (message.id === messageId ? newMessage : message)));
        },
        [messages]
    );

    const removeMessage = useCallback(
        (messageId: string) => {
            setMessages(messages.filter((message) => message.id !== messageId));
        },
        [messages]
    );

    return (
        <div className="messages">
            {messages.map((message) => (
                <Message
                    key={message.id}
                    id={message.id}
                    body={message.body}
                    attributes={message.attributes}
                    errors={message.errors}
                    onChange={updateMessage}
                    onSend={sendMessage}
                    onRemove={removeMessage}
                />
            ))}
            <Button className="add-message-btn" variant="contained" color="primary" size="large" disableElevation onClick={addMessage}>
                Add Message
            </Button>
        </div>
    );
};
