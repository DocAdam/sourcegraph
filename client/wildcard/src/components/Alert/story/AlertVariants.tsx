import 'storybook-addon-designs'

import { action } from '@storybook/addon-actions'
import classNames from 'classnames'
import { flow } from 'lodash'
import React from 'react'

import { Alert, AlertProps } from '../Alert'
import styles from '../Alert.module.scss'
import { ALERT_VARIANTS } from '../constants'

import { preventDefault } from './util'

interface AlertVariantsProps extends Pick<AlertProps, 'as'> {
    variants: readonly typeof ALERT_VARIANTS[number][]
}

export const AlertVariants: React.FunctionComponent<AlertVariantsProps> = ({ variants, as }) => (
    <div>
        {variants.map(variant => (
            <Alert key={variant} as={as} variant={variant}>
                <h4>Too many matching repositories</h4>
                Use a 'repo:' or 'repogroup:' filter to narrow your search.
            </Alert>
        ))}
        <Alert className={classNames('d-flex align-items-center', styles.alert, styles.alertInfo)}>
            <div className="flex-grow-1">
                <h4>Too many matching repositories</h4>
                Use a 'repo:' or 'repogroup:' filter to narrow your search.
            </div>
            <a href="/" onClick={flow(preventDefault, action(classNames('link clicked', styles.alert)))}>
                Dismiss
            </a>
        </Alert>
    </div>
)
