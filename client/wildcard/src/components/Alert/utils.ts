import styles from './Alert.module.scss'
import { ALERT_VARIANTS } from './constants'

interface GetAlertStyleParameters {
    variant: typeof ALERT_VARIANTS[number]
}

export const getAlertStyle = ({ variant }: GetAlertStyleParameters): string =>
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    `${styles.alert} ${styles[`alert${variant}`]}`
