import classNames from 'classnames'
import CloseIcon from 'mdi-react/CloseIcon'
import React from 'react'

import { PANEL_POSITIONS } from './constants'
import styles from './Panel.module.scss'

interface PanelProps {
    position: typeof PANEL_POSITIONS[number]
    onDismiss: () => void
    className?: string
}

export const Panel: React.FunctionComponent<PanelProps> = ({ children, position, className, onDismiss }) => (
    <div className={classNames(className, styles.panel, styles[position])}>
        <button
            type="button"
            onClick={onDismiss}
            className={classNames(
                'btn btn-icon',
                styles.dismissButton,
                position === 'bottom' ? styles.dismissButtonRight : styles.dismissButtonLeft
            )}
            title="Close panel"
            data-tooltip="Close panel"
            data-placement="left"
            data-testid="panel-onDismiss-button"
        >
            <CloseIcon className="icon-inline" />
        </button>
        {children}
    </div>
)
