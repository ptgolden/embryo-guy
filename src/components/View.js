"use strict";

const h = require('react-hyperscript')
    , R = require('ramda')
    , React = require('react')
    , styled = require('styled-components').default
    , { Navigable } = require('org-shell')
    , { connect } = require('react-redux')
    , { Box, Button } = require('rebass')
    , MAPlot = require('./MAPlot')
    , TreatmentSelector = require('./TreatmentSelector')
    , Action = require('../actions')
    , Table = require('./Table')
    , WatchedTranscripts = require('./WatchedTranscripts')
    , InfoBox = require('./InfoBox')
    , PValueSelector = require('./PValueSelector')
    , Log = require('./Log')
    , ProjectLoading = require('./ProjectLoading')

const ViewerContainer = styled.div`
  display: grid;
  height: 100%;

  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(12, 1fr);
`

const GridArea = styled.div`
  position: relative;
  grid-column: ${ props => props.column };
  grid-row: ${ props => props.row };
`

class Viewer extends React.Component {
  async componentDidMount() {
    await this.updateTreatments({})
    await this.updateView({ opts: {}})
  }

  async componentDidUpdate(prevProps) {
    await this.updateTreatments(prevProps)
    this.updateView(prevProps)

  }

  updateView(prevProps) {
    const { dispatch } = this.props

    if (this.props.opts.p !== prevProps.opts.p) {
      dispatch(Action.SetPValueThreshold(parseFloat(this.props.opts.p) || 1))
    }
  }

  async updateTreatments(prevProps) {
    const { dispatch, updateOpts } = this.props

    let { treatmentA, treatmentB } = this.props

    if (!treatmentA || !treatmentB) {
      const resp = await dispatch(Action.GetDefaultPairwiseComparison)
      const { response } = resp.readyState
      treatmentA = response.treatmentA
      treatmentB = response.treatmentB
      updateOpts(opts => Object.assign({}, opts, { treatmentA, treatmentB }))
      return
    }

    const updateTreatments = (
      treatmentA !== prevProps.treatmentA ||
      treatmentB !== prevProps.treatmentB
    )

    if (updateTreatments) {
      await dispatch(Action.SetPairwiseComparison(treatmentA, treatmentB))
    }
  }

  render() {
    const { updateOpts, treatmentA, treatmentB } = this.props

    return (
      h(ViewerContainer, [
        h(GridArea, { column: '1 / span 10', row: '1 / span 2' }, [
          h('div', {
            style: {
              height: '100%',
              width: '100%',
              position: 'relative',
            },
          }, [
            treatmentA && h(TreatmentSelector, {
              useSelectBackup: true,
              tooltipPos: 'bottom',
              selectedTreatment: treatmentA,
              onSelectTreatment: treatment => {
                updateOpts(opts => Object.assign({}, opts, { treatmentA: treatment }))
              },
            }),
          ]),
        ]),

        h(GridArea, { column: '1 / span 10', row: '11 / span 2' }, [
          h('div', {
            style: {
              height: '100%',
              width: '100%',
              position: 'relative',
            },
          }, [
            treatmentB && h(TreatmentSelector, {
              useSelectBackup: true,
              tooltipPos: 'top',
              selectedTreatment: treatmentB,
              onSelectTreatment: treatment => {
                updateOpts(opts => Object.assign({}, opts, { treatmentB: treatment }))
              },
            }),
          ]),
        ]),

        h(GridArea, { column: '1 / span 9', row: '3 / span 8', ['data-area']: 'plot' },
          h(MAPlot)
        ),

        h(GridArea, { column: '10 / span 1', row: '3 / span 8' },
          h(PValueSelector, { updateOpts }),
        ),

        h(GridArea, { column: '12 / span 13', row: '1 / span 9' }, [
          h('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            },
          }, [
            h(WatchedTranscripts),
            h('div', {
              ['data-area']: 'table',

              // This sucks big time
              style: {
                flex: 1,
                maxHeight: 'calc(100% - 84px)',
              },
            }, [
              h(Table),
            ]),
          ]),
        ]),

        h(GridArea, { column: '12 / span 13', row: '10 / span 3' },
          h(InfoBox, { updateOpts })
        ),
      ])
    )
  }
}

module.exports = R.pipe(
  Navigable,
  connect((state, ownProps) => {
    const { treatmentA, treatmentB } = ownProps.opts

    return { treatmentA, treatmentB }
  }),
  ProjectLoading(true)
)(Viewer)
