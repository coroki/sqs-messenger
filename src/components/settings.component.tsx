import { Button, CircularProgress, InputLabel, TextField } from '@material-ui/core';
import ContactlessIcon from '@material-ui/icons/Contactless';
import { Alert } from '@material-ui/lab';
import React, { useCallback, useMemo, useState } from 'react';
import { SqsConfig, SqsConnectionStatus } from './app.component';

type Props = {
    /**
     * The SQS configuration, containing the details of the user's AWS account and SQS queue.
     */
    config: SqsConfig;

    /**
     * Emitted when the user chooses to test the SQS configuration by sending a basic SQS message.
     *
     * @param config    The SQS configuration and queue details.
     * @returns         A promise that resolves to the SQS connection status.
     */
    onTestConnection: (config: SqsConfig) => Promise<SqsConnectionStatus>;

    /**
     * Emitted when the AWS account and SQS queue details are changed.
     *
     * @param config    The updated configuration.
     */
    onChange: (config: SqsConfig) => void;
};

/**
 * Renders an editable AWS account and SQS configuration.
 */
export const Settings: React.FC<Props> = (props) => {
    const [connectionStatus, setConnectionStatus] = useState<SqsConnectionStatus>('unknown');
    const [connectionError, setConnectionError] = useState<string>();
    const [testing, setTesting] = useState(false);

    const onFieldChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            props.onChange({ ...props.config, [event.target.name]: event.target.value });
            setConnectionError('');
        },
        [props.config, props.onChange]
    );

    const valid = useMemo(() => {
        return Object.keys(props.config).every((key) => {
            const value = props.config[key as keyof SqsConfig];
            return !!value;
        });
    }, [props.config]);

    const notification = useMemo(() => {
        switch (connectionStatus) {
            case 'ok':
                return <Alert severity="success">Connection to SQS queue established.</Alert>;
            case 'failed':
                return <Alert severity="error">{connectionError}</Alert>;
        }
    }, [connectionStatus, connectionError]);

    const testConnection = useCallback(async () => {
        if (!testing) {
            try {
                setTesting(true);
                setConnectionStatus('unknown');
                setConnectionError('');
                const status = await props.onTestConnection(props.config);
                setConnectionStatus(status);
            } catch (error) {
                setConnectionStatus('failed');
                setConnectionError(error);
            } finally {
                setTesting(false);
            }
        }
    }, [props.config, props.onTestConnection]);

    return (
        <div className="settings">
            <div className="settings-config">
                {notification}
                <div className="settings-inputs">
                    <InputLabel>Region</InputLabel>
                    <TextField className="settings-field" variant="outlined" name="region" value={props.config.region} onChange={onFieldChange} />
                    <InputLabel>Access Key ID</InputLabel>
                    <TextField className="settings-field" variant="outlined" name="accessKeyId" value={props.config.accessKeyId} onChange={onFieldChange} />
                    <InputLabel>Access Key Secret</InputLabel>
                    <TextField className="settings-field" variant="outlined" name="secretAccessKey" value={props.config.secretAccessKey} onChange={onFieldChange} />
                    <InputLabel>Session Token</InputLabel>
                    <TextField className="settings-field" variant="outlined" name="sessionToken" value={props.config.sessionToken} onChange={onFieldChange} />
                    <InputLabel>Queue URL</InputLabel>
                    <TextField className="settings-field" variant="outlined" name="queueUrl" value={props.config.queueUrl} onChange={onFieldChange} />
                </div>
            </div>
            <Button
                className="test-connection-btn"
                variant="contained"
                color="primary"
                size="large"
                disabled={!valid}
                disableElevation
                endIcon={testing ? <CircularProgress color="inherit" size={20} /> : <ContactlessIcon />}
                onClick={testConnection}
            >
                Test Connection
            </Button>
        </div>
    );
};
