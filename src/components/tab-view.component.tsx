import { useTabContext } from '@material-ui/lab';
import React from 'react';

type Props = {
    /**
     * The tab view's value associated with a selectable tab item in the parent hierarchy.
     */
    value: string;

    /**
     * An optional class name that is assigned to the component's root element.
     */
    className?: string;

    /**
     * An optional flag that, when true, will unmount the provided children when the tab view
     * is not the currently selected tab content.
     * Defaults to false, which will only set a display:none CSS style on the component's root element.
     */
    unmount?: boolean;
};

/**
 * Renders the provided children if a parent Material-UI TabContext indicates
 * it is the currently selected content.
 *
 * Note: This is used in place of the Material UI's TabPanel due to that component unmounting
 * the wrapped children when they are not currently selected.
 */
export const TabView: React.FC<Props> = (props) => {
    const context = useTabContext();

    const active = context?.value === props.value;

    return (
        <div className={props.className} style={{ display: active ? 'inherit' : 'none' }}>
            {(active || !props.unmount) && props.children}
        </div>
    );
};

TabView.defaultProps = {
    unmount: false,
};
