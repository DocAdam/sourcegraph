import classNames from 'classnames'
import InformationOutlineIcon from 'mdi-react/InformationOutlineIcon'
import React from 'react'

import styles from './CaptureGroupSeriesInfoBadge.module.scss'

export const CaptureGroupSeriesInfoBadge: React.FunctionComponent = props => (
    <div className={classNames(styles.badge, 'text-muted')}>
        <InformationOutlineIcon className={styles.icon} />
        <small>{props.children}</small>
    </div>
)
