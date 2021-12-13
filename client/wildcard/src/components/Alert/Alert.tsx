import classNames from 'classnames'
import React from 'react'

import { ALERT_VARIANTS } from './constants'
import { getAlertStyle } from './utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: typeof ALERT_VARIANTS[number]
    as?: React.ElementType
}

export const Alert: React.FunctionComponent<AlertProps> = React.forwardRef(
    ({ children, as: Component = 'div', variant, className, ...attributes }, reference) => (
        <Component
            ref={reference}
            className={classNames(variant && getAlertStyle({ variant }), className)}
            {...attributes}
        >
            {children}
        </Component>
    )
)
