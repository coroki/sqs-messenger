import { SQS } from 'aws-sdk';
import { SqsMessage, SqsMessageAttribute, SqsMessageAttributeType } from '../components/app.component';

export class MessageUtils {
    /**
     * Generates a new random ID.
     */
    public static generateRandomId() {
        return Math.round(Math.random() * 100000).toString();
    }

    /**
     * Formats the provided message body.
     * If provided JSON content, this will indent the content.
     *
     * @param body    The message body.
     */
    public static formatBody(body: string): string {
        let text = body.trim();

        try {
            if (MessageUtils.isJson(text)) {
                const obj = JSON.parse(text);
                text = JSON.stringify(obj, null, 4);
            }
        } catch {
            // do nothing
        }

        return text;
    }

    /**
     * Validates the provided SQS message for errors.
     *
     * @param message    The SQS message to be validated.
     * @returns          If invalid, an array of errors, otherwise undefined.
     */
    public static validateMessage(message: SqsMessage): string[] | undefined {
        const errors: string[] = [];

        if (!message.body) {
            errors.push('Body is not defined.');
        }

        const attributeTypes = Object.keys(MessageUtils.getAttributeTypes());

        if (!MessageUtils.isPropertyUnique('name', message.attributes)) {
            errors.push(`Attribute Name is not unique.`);
        }

        message.attributes.forEach((attribute, index) => {
            if (!attribute.name) {
                errors.push(`Attribute Name at position ${index} is undefined.`);
            }
            if (!attribute.value) {
                errors.push(`Attribute Value at position ${index} is undefined.`);
            } else if (attribute.type === 'Number' && !MessageUtils.isNumeric(attribute.value)) {
                errors.push(`Attribute value at position ${index} is not a number.`);
            }
            if (!attributeTypes.some((type) => attribute.type === type)) {
                errors.push(`Attribute Data Type at position ${index} is invalid.`);
            }
        });

        if (errors.length) {
            return errors;
        }
    }

    /**
     * Converts the provided SQS message to an AQS SQS message request.
     *
     * @param queryUrl    The SQS queue URL the message will be posted to.
     * @param message     The SQS message details.
     */
    public static toRequest(queryUrl: string, message: SqsMessage): SQS.SendMessageRequest {
        const mapAttribute = (attribute: SqsMessageAttribute): SQS.MessageAttributeValue => {
            switch (attribute.type) {
                case 'String':
                case 'Number':
                    return { DataType: attribute.type, StringValue: attribute.value as string };
                case 'Binary':
                    return { DataType: attribute.type, BinaryValue: attribute.value };
                default:
                    throw new Error(`Could not map unknown attribute type: '${attribute.type}'.`);
            }
        };

        return {
            QueueUrl: queryUrl,
            MessageBody: message.body,
            MessageAttributes: message.attributes.reduce<SQS.MessageBodyAttributeMap>((map, attribute) => {
                return { ...map, [attribute.name]: mapAttribute(attribute) };
            }, {}),
        };
    }

    /**
     * Converts the provided item to an SQS message.
     * The item represents an item taken from a local message.js source that is
     * loaded when the application initializes.
     *
     * @param item    The item that will be converted.
     */
    public static toMessage(item: unknown): SqsMessage {
        const message = item as SqsMessage;
        return {
            ...message,
            id: MessageUtils.generateRandomId(),
            body: MessageUtils.formatBody(message.body),
            attributes:
                message.attributes?.map((attribute) => ({
                    ...attribute,
                    id: MessageUtils.generateRandomId(),
                })) ?? [],
            errors: MessageUtils.validateMessage(message),
        };
    }

    /**
     * Returns an object with all the supported SQS message attribute data types.
     * Used to ensure different parts of the application support all necessary data types.
     */
    public static getAttributeTypes(): Record<SqsMessageAttributeType, SqsMessageAttributeType> {
        return {
            String: 'String',
            Binary: 'Binary',
            Number: 'Number',
        };
    }

    /**
     * Returns true if all objects in the provided array contain unique values for the specified property, otherwise false.
     *
     * @param key        The key of the property to check for uniqueness.
     * @param objects    The array of objects to be inspected.
     */
    public static isPropertyUnique = <TObject, K extends keyof TObject>(key: K, objects: TObject[]): boolean => {
        const propertyValues = objects.reduce<Array<TObject[K]>>((values, obj) => {
            const value = obj[key];
            if (values.indexOf(value) >= 0) {
                return values;
            }
            return [...values, value];
        }, []);

        return propertyValues.length == objects.length;
    };

    private static isNumeric(str: any): boolean {
        return !isNaN(str) && !isNaN(parseFloat(str));
    }

    private static isJson(text: string): boolean {
        return text[0] === '{' && text[text.length - 1] === '}';
    }
}
