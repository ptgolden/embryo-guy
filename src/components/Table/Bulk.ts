import h from 'react-hyperscript'
import * as React from 'react'
import * as R from 'ramda'

import makeGenericTable, { TableColumn } from './GenericTable'
import { useView, useComparedTreatmentLabels } from '../../view/hooks'
import { useAppDispatch } from '../../hooks'
import { actions as viewActions } from '../../view'
import { formatNumber } from '../../utils'

import {
  BulkViewState,
  BulkDifferentialExpression,
  BulkDisplayedTranscriptsSource,
} from '../../types'

type TranscriptCallback<AllowNull extends boolean> =
  (transcript: AllowNull extends true ? (string | null) : string) => void

type TableData = {
  displayedTranscripts: {
    source: BulkDisplayedTranscriptsSource;
    transcripts: Array<BulkDifferentialExpression>;
  } | null;
  savedTranscripts: Set<string>;
  pValueThreshold: number;
  focusedTranscript: string | null;

  setHoveredTranscript: TranscriptCallback<true>;
  addSavedTranscript: TranscriptCallback<false>;
  removeSavedTranscript: TranscriptCallback<false>;
  setFocusedTranscript: TranscriptCallback<true>;
}

const Table = makeGenericTable<BulkViewState, TableData>()

const PAIRWISE_NUM_WIDTHS = 64
    , ABUNDANCE_WIDTHS = 88
    , MARKER_WIDTH = 28

function sortFor(val: string) {
  return {
    key: val,
    active: (x: BulkViewState) => x.sortPath === val
  }
}

function getColumns(width: number, view: BulkViewState): TableColumn<BulkViewState, TableData>[] {
  const labelWidth = width - MARKER_WIDTH - 3 * PAIRWISE_NUM_WIDTHS - 4 * ABUNDANCE_WIDTHS

  const getItem = (data: TableData, index: number) =>
    data.displayedTranscripts!.transcripts[index]!

  return [
    {
      key: 'marker',
      label: '',
      width: MARKER_WIDTH,
      sort: null,
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)
            , saved = data.savedTranscripts.has(datum.name)

        return (
          h('a', {
            className: 'transcript-save-marker',
            href: '',
            style: {
              color: saved ? 'orangered' : 'blue',
            },
            onClick(e: React.MouseEvent) {
              e.preventDefault()

              if (saved) {
                data.removeSavedTranscript(datum.name)
              } else {
                data.addSavedTranscript(datum.name)
              }

            },
          }, saved ? '×' : '<')
        )
      }
    },

    {
      key: 'transcript',
      label: 'Transcript',
      width: labelWidth,
      sort: sortFor('label'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return (
          h('div.transcript-label', datum.label)
        )
      },
    },

    {
      key: 'pvalue',
      label: 'P-Value',
      width: PAIRWISE_NUM_WIDTHS,
      sort: sortFor('pValue'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.pValue, 3)
      },
    },

    {
      key: 'logata',
      label: 'logATA',
      width: PAIRWISE_NUM_WIDTHS,
      sort: sortFor('logATA'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.logATA)
      },
    },

    {
      key: 'logfc',
      label: 'logFC',
      width: PAIRWISE_NUM_WIDTHS,
      sort: sortFor('logFC'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.logFC)
      },
    },

    {
      key: 'meanA',
      label: 'Mean',
      width: ABUNDANCE_WIDTHS,
      sort: sortFor('treatmentA_AbundanceMean'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.treatmentA_AbundanceMean)
      },
    },

    {
      key: 'medianA',
      label: 'Median',
      width: ABUNDANCE_WIDTHS,
      sort: sortFor('treatmentA_AbundanceMedian'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.treatmentA_AbundanceMedian)
      },
    },

    {
      key: 'meanB',
      label: 'Mean',
      width: ABUNDANCE_WIDTHS,
      sort: sortFor('treatmentB_AbundanceMean'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.treatmentB_AbundanceMean)
      },
    },

    {
      key: 'medianB',
      label: 'Median',
      width: ABUNDANCE_WIDTHS,
      sort: sortFor('treatmentB_AbundanceMedian'),
      renderRow(data: TableData, index: number) {
        const datum = getItem(data, index)

        return formatNumber(datum.treatmentB_AbundanceMedian)
      },
    },
  ]
}


export default function BulkTable() {
  const view = useView('Bulk')
      , dispatch = useAppDispatch()

  const {
    savedTranscripts,
    focusedTranscript,
    displayedTranscripts,
    order,
    pValueThreshold,
  } = view

  const [ treatmentALabel, treatmentBLabel ] = useComparedTreatmentLabels()

  const handlers = {
    setHoveredTranscript(transcript: string | null) {
      dispatch(viewActions.setHoveredTranscript({ transcript }))
    },
    setFocusedTranscript(transcript: string | null) {
      dispatch(viewActions.setFocusedTranscript({ transcript }))
    },
    addSavedTranscript(transcript: string) {
      const next = new Set([...savedTranscripts, transcript])

      dispatch(viewActions.setSavedTranscripts({
        transcriptNames: [...next],
      }))
    },
    removeSavedTranscript(transcript: string) {
      const next = new Set(savedTranscripts)
      next.delete(transcript)
      dispatch(viewActions.setSavedTranscripts({
        transcriptNames: [...next],
      }))
    },
  }


  return (
    h(Table, {
      updateSort(key, order) {
      },
      sortOrder: view.order,
      context: view,
      getColumns,
      itemCount: displayedTranscripts?.transcripts.length || 0,
      itemData: {
        focusedTranscript,
        displayedTranscripts,
        savedTranscripts,
        pValueThreshold,
        ...handlers,
      }
    })
  )
}
