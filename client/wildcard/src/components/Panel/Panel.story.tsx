import { select } from '@storybook/addon-knobs'
import { DecoratorFn, Meta, Story } from '@storybook/react'
import React from 'react'

import { BrandedStory } from '@sourcegraph/branded/src/components/BrandedStory'
import { panels } from '@sourcegraph/branded/src/components/panel/Panel.fixtures'
import { EmptyPanelView } from '@sourcegraph/branded/src/components/panel/views/EmptyPanelView'
import webStyles from '@sourcegraph/web/src/SourcegraphWebApp.scss'

import { Grid } from '..'
import { AllButtons } from '../Button/story/Button.story'
import { Tabs, Tab, TabList, TabPanel, TabPanels } from '../Tabs'

import { PANEL_POSITIONS } from './constants'
import { Panel } from './Panel'

const decorator: DecoratorFn = story => <BrandedStory styles={webStyles}>{() => <div>{story()}</div>}</BrandedStory>

const config: Meta = {
    title: 'wildcard/Panel',

    decorators: [decorator],

    parameters: {
        component: Panel,
        design: {
            type: 'figma',
            name: 'Figma',
            url: 'https://www.figma.com/file/NIsN34NH7lPu04olBzddTw/Wildcard-Design-System?node-id=3008%3A502',
        },
    },
}

export default config

export const Simple: Story = () => (
    <Panel onDismiss={() => {}} position={select('Position', PANEL_POSITIONS, 'bottom')} />
)

export const Bottom: Story = () => {
    const [tabIndex, setTabIndex] = React.useState(0)
    const activeTab = panels[tabIndex]

    const closePanel = () => setTabIndex(-1)

    return (
        <Panel onDismiss={closePanel} position="bottom">
            <Tabs index={tabIndex} size="small">
                <TabList>
                    {panels.map((item, index) => (
                        <Tab key={item.id}>
                            <span className="tablist-wrapper--tab-label" onClick={() => setTabIndex(index)} role="none">
                                {item.title}
                            </span>
                        </Tab>
                    ))}
                </TabList>
                <TabPanels>
                    {activeTab ? (
                        panels.map(({ id, content }) => (
                            <TabPanel key={id}>
                                <Grid columnCount={3} spacing={2}>
                                    {new Array(6).fill(0).map((_value, index) => (
                                        <div key={index}>
                                            Content {index + 1} of {content}
                                        </div>
                                    ))}
                                </Grid>
                            </TabPanel>
                        ))
                    ) : (
                        <EmptyPanelView />
                    )}
                </TabPanels>
            </Tabs>
        </Panel>
    )
}

export const Side: Story = () => (
    <Panel onDismiss={() => {}} position="side">
        <div className="mx-2 mt-4">
            <AllButtons />
        </div>
    </Panel>
)
