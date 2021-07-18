import { AppBar, Tab } from '@material-ui/core';
import { TabContext, TabList } from '@material-ui/lab';
import * as AWS from 'aws-sdk';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageUtils } from '../utils/message.utils';
import { Messages } from './messages.component';
import { Settings } from './settings.component';
import { TabView } from './tab-view.component';

export type SqsConfig = {
    /**
     * The AWS region.
     */
    region: string;

    /**
     * The connecting user's AWS access key ID.
     */
    accessKeyId: string;

    /**
     * The connecting user's acess key secret.
     */
    secretAccessKey: string;

    /**
     * The connection user's AWS session token.
     */
    sessionToken: string;

    /**
     * The SQS queue URL.
     */
    queueUrl: string;
};

export type SqsMessage = {
    /**
     * The message's unique identifier.
     */
    id: string;

    /**
     * The message's body.
     */
    body: string;

    /**
     * The message attributes.
     */
    attributes: SqsMessageAttribute[];

    /**
     * The message's client-side validation errors.
     */
    errors?: string[];
};

export type SqsMessageAttribute = {
    /**
     * The attribute's unique identifier.
     */
    id: string;

    /**
     * The attibute's unique name.
     */
    name: string;

    /**
     * The attributes value's data type.
     */
    type: SqsMessageAttributeType;

    /**
     * The attribute's value.
     */
    value: SqsMessageAttributeValue;
};

export type SqsMessageAttributeValue = Buffer | Uint8Array | Blob | string;

export type SqsMessageAttributeType = 'String' | 'Number' | 'Binary';

export type SqsConnectionStatus = 'unknown' | 'ok' | 'failed';

/**
 * Renders the application's main content.
 */
export const App: React.FC = () => {
    const [tab, setTab] = useState('settings');
    const [messages, setMessages] = useState<SqsMessage[]>();

    // If a local .env file is present, variables from it will be loaded
    // as environment variables by parcel when the application is transpiled.
    const [config, setConfig] = useState<SqsConfig>({
        region: process.env.AWS_REGION || '',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN || '',
        queueUrl: process.env.AWS_SQS_QUEUE_URL || '',
    });

    const sqs = useMemo(() => {
        AWS.config.update(config);
        return new AWS.SQS();
    }, [config]);

    const sendMessage = useCallback(
        (message: SqsMessage) => {
            return new Promise<boolean>((resolve, reject) => {
                const request = MessageUtils.toRequest(config.queueUrl, message);

                sqs.sendMessage(request, (error) => {
                    if (error) {
                        console.error({ error });
                        return reject(error.message);
                    }
                    resolve(true);
                });
            });
        },
        [sqs]
    );

    const updateTab = useCallback((event: React.ChangeEvent<{}>, newTab: string) => {
        setTab(newTab);
    }, []);

    // Testing Queue with basic message.
    const testConnection = useCallback(async (): Promise<SqsConnectionStatus> => {
        const success = await sendMessage({
            id: MessageUtils.generateRandomId(),
            body: 'connection test',
            attributes: [],
        });

        if (!success) {
            return 'failed';
        }

        return 'ok';
    }, [sqs]);

    useEffect(() => {
        try {
            import('../../messages.js' as string)
                .then((data) => {
                    const items: unknown[] = data.default;
                    const initialMessages = items.map<SqsMessage>(MessageUtils.toMessage);
                    setMessages(initialMessages);
                })
                .catch(() => {
                    setMessages([
                        {
                            id: MessageUtils.generateRandomId(),
                            body: '',
                            attributes: [],
                        },
                    ]);

                    console.warn(`Could not find local messages.js file.`);
                });
        } catch {
            // do nothing
        }
    }, []);

    return (
        <div className="app">
            <TabContext value={tab}>
                <AppBar>
                    <TabList value={tab} indicatorColor="primary" variant="fullWidth" onChange={updateTab}>
                        <Tab label="Settings" value="settings" />
                        <Tab label="Messages" value="messages" />
                    </TabList>
                </AppBar>
                <TabView className="tab-view" value="settings" unmount>
                    <Settings config={config} onChange={setConfig} onTestConnection={testConnection} />
                </TabView>
                <TabView className="tab-view" value="messages">
                    {!!messages && <Messages initialMessages={messages} onSendMessage={sendMessage} />}
                </TabView>
            </TabContext>
        </div>
    );
};
