import { IconButton, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import React, { ChangeEvent, useCallback } from 'react';
import { MessageUtils } from '../utils/message.utils';
import { SqsMessageAttribute, SqsMessageAttributeType } from './app.component';

type Props = SqsMessageAttribute & {
    /**
     * Hides all field labels.
     */
    hideLabels?: boolean;

    /**
     * Emitted when the user changes any of the attributes fields.
     *
     * @param id           The attribute's unique identifier.
     * @param attribute    The modified attribute object.
     */
    onChange: (id: string, attribute: SqsMessageAttribute) => void;

    /**
     * Emitted when the user has chosen to remove the attribute.
     *
     * @param id    The attribute's unique identifier.
     */
    onRemove: (id: string) => void;
};

const attributeTypes = MessageUtils.getAttributeTypes();

/**
 * Renders a message attribute.
 */
export const MessageAttribute: React.FC<Props> = (props) => {
    const onChange = useCallback(
        (attribute: Partial<SqsMessageAttribute>) => {
            props.onChange(props.id, { id: props.id, name: props.name, type: props.type, value: props.value, ...attribute });
        },
        [props]
    );

    const onRemove = useCallback(() => {
        props.onRemove(props.id);
    }, [props]);

    const onNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => onChange({ name: event.target.value }), [onChange]);
    const onTypeChange = useCallback((event: ChangeEvent<{ value: unknown }>) => onChange({ type: event.target.value as SqsMessageAttributeType }), [onChange]);
    const onValueChange = useCallback((event: ChangeEvent<HTMLInputElement>) => onChange({ value: event.target.value }), [onChange]);

    return (
        <div className="message-attribute">
            {!props.hideLabels && (
                <div className="message-attribute-labels">
                    <InputLabel className="message-attribute-name">Name</InputLabel>
                    <InputLabel className="message-attribute-type">Data Type</InputLabel>
                    <InputLabel className="message-attribute-value">Value</InputLabel>
                </div>
            )}
            <div className="message-attribute-inputs">
                <TextField className="message-attribute-name" variant="outlined" value={props.name} onChange={onNameChange} />
                <Select className="message-attribute-type" variant="outlined" value={props.type} onChange={onTypeChange}>
                    {Object.keys(attributeTypes).map((type) => (
                        <MenuItem key={type} value={type}>
                            {type}
                        </MenuItem>
                    ))}
                </Select>
                <TextField className="message-attribute-value" variant="outlined" value={props.value} onChange={onValueChange} />
                <IconButton className="message-attribute-delete-btn" onClick={onRemove}>
                    <DeleteIcon />
                </IconButton>
            </div>
        </div>
    );
};
