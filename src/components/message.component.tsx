import { Button, CircularProgress, IconButton, TextField } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import SendIcon from '@material-ui/icons/Send';
import { Alert } from '@material-ui/lab';
import React, { useCallback, useState } from 'react';
import { MessageUtils } from '../utils/message.utils';
import { SqsMessage, SqsMessageAttribute } from './app.component';
import { MessageAttribute } from './message-attribute.component';

type Props = SqsMessage & {
    /**
     * Emitted when the user changes any of the message's details.
     *
     * @param id         The message's unique identifier.
     * @param message    The updated message.
     */
    onChange: (id: string, message: SqsMessage) => void;

    /**
     * Emitted when the user chooses to send the SQS message to a queue.
     *
     * @param id         The message's unique identifier.
     * @param message    The sent message.
     * @return           A promise the resolves to a boolean indicating the success of the send action.
     */
    onSend: (id: string, message: SqsMessage) => Promise<boolean>;

    /**
     * Emitted when the user chooses to remove the message.
     *
     * @param id         The message's unique identifier.
     */
    onRemove: (id: string) => void;
};

const TAB_SPACES = '    ';

const delay = (duration: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, duration);
    });

/**
 * Renders inputs for entering the details of a POSTable SQS message.
 */
export const Message: React.FC<Props> = (props) => {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const updateMessage = useCallback(
        (message: Partial<SqsMessage>) => {
            props.onChange(props.id, { id: props.id, body: props.body, attributes: props.attributes, ...message });
            setSent(false);
        },
        [props]
    );

    const onBodyKeyDown = useCallback(
        async (event: React.KeyboardEvent<HTMLInputElement>) => {
            // Disable tab navigation so tabs can be used in field.
            if (event.key === 'Tab') {
                const element = event.target as HTMLInputElement;
                const selectionStart = element.selectionStart || 0;
                const body = element.value.substring(0, selectionStart) + TAB_SPACES + element.value.substring(selectionStart);
                const cursorPos = selectionStart + TAB_SPACES.length;
                event.preventDefault();

                updateMessage({ body });

                // Waiting small duration so changes to effect so selection range is accurate.
                await delay(10);

                element.setSelectionRange(cursorPos, cursorPos);
            }
        },
        [updateMessage]
    );

    const updateBody = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            updateMessage({ body: event.target.value });
        },
        [updateMessage]
    );

    const updateAttribute = useCallback(
        (attributeId: string, newAttribute: SqsMessageAttribute) => {
            updateMessage({ attributes: props.attributes.map((attribute) => (attribute.id === attributeId ? newAttribute : attribute)) });
        },
        [updateMessage]
    );

    const addAttribute = useCallback(() => {
        updateMessage({
            attributes: [
                ...props.attributes,
                {
                    id: MessageUtils.generateRandomId(),
                    name: '',
                    type: 'String',
                    value: '',
                },
            ],
        });
    }, [updateMessage]);

    const removeAttribute = useCallback(
        (attributeId: string) => {
            updateMessage({ attributes: props.attributes.filter((attribute) => attribute.id !== attributeId) });
        },
        [updateMessage]
    );

    const sendMessage = useCallback(async () => {
        if (!props.errors && !sending) {
            setSent(false);
            setSending(true);
            const success = await props.onSend(props.id, { id: props.id, body: props.body, attributes: props.attributes });
            setSent(success);
            setSending(false);
        }
    }, [props]);

    const removeMessage = useCallback(() => {
        props.onRemove(props.id);
    }, [props.id, props.onRemove]);

    return (
        <div className="message" style={{ borderColor: props.errors && 'red' }}>
            {props.errors &&
                props.errors.map((error, index) => (
                    <Alert key={index} severity="error">
                        {error}
                    </Alert>
                ))}
            {sent && <Alert severity="success">Message successfully sent.</Alert>}
            <div className="message-top">
                <h3 className="message-header">Body</h3>
                <IconButton className="message-delete-btn" onClick={removeMessage}>
                    <DeleteIcon />
                </IconButton>
            </div>
            <TextField className="message-body-field" variant="outlined" multiline value={props.body} placeholder="Enter body" onKeyDown={onBodyKeyDown} onChange={updateBody} />
            <Button
                className="message-send-btn"
                variant="contained"
                color="primary"
                disabled={!!props.errors}
                disableElevation
                endIcon={sending ? <CircularProgress color="inherit" size={20} /> : <SendIcon />}
                onClick={sendMessage}
            >
                Send
            </Button>
            <h3 className="message-header">Attributes</h3>
            <hr className="message-hr" />
            <div className="message-attributes">
                {props.attributes.map((attribute, index) => (
                    <MessageAttribute
                        key={attribute.id}
                        id={attribute.id}
                        name={attribute.name}
                        type={attribute.type}
                        value={attribute.value}
                        hideLabels={index > 0}
                        onChange={updateAttribute}
                        onRemove={removeAttribute}
                    />
                ))}
                <button className="message-attribute-add-btn" onClick={addAttribute}>
                    Add Attribute
                </button>
            </div>
        </div>
    );
};
