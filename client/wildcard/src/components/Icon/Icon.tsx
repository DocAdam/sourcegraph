import classNames from 'classnames'
import React from 'react'

import { ICON_SIZES } from './constants'
import styles from './Icon.module.scss'
interface IconProps {
    className?: string
    svg: React.SVGAttributes<SVGSVGElement>
    /**
     * The variant style of the icon. defaults to 'inline'
     */
    size?: typeof ICON_SIZES[number]
}

export const Icon: React.FunctionComponent<IconProps> = ({ svg, className, size, ...attributes }) => (
    <div className={classNames(styles.iconInline, size === 'md' && styles.iconInlineMd, className)} {...attributes}>
        {svg}
    </div>
)
