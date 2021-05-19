import h from 'react-hyperscript'
import styled, { CSSObject } from 'styled-components'
import * as R from 'ramda'
import * as React from 'react'
import { FixedSizeList as List } from 'react-window'

import { useAppDispatch, useResizeCallback } from '../../hooks'
import {
  useView,
  useComparedTreatmentLabels,
  actions as viewActions
} from '../../view'

import {
  BulkTableSortPath,
  TableSortOrder,
} from '../../types'

import {
  TableWrapper,
  TableHeaderCell,
  TableHeaderWrapper,
  TableHeaderRow,
  TableBodyWrapper
} from './Elements'

import TranscriptRow from './Row'

const { useState } = React

const DEFAULT_ROW_HEIGHT = 28

type DimensionState = null | {
  height: number;
  width: number;
  widthWithScrollbar: number;
}

export type TableColumn<T, U> = {
  key: string;
  label: string | ((context: T) => string);
  width: number;
  borderLeft?: boolean;
  sort: null | {
    key: string;
    active: (context: T) => boolean;
  };
  renderRow: (data: U, index: number) => React.ReactNode;
}

type TableData<T, U> = {
  context: T;
  getColumns: (totalWidth: number, context: T) => TableColumn<T, U>[];
  itemCount: number,
  itemData: U;
  sortOrder: TableSortOrder;
  updateSort: (sortPath: string, order: TableSortOrder) => void;

  rowHeight?: number;
  renderHeaderRows?: (columWidths: number[], context: T) => React.ReactNode[];

}

function columnWidths<T, U>(columns: TableColumn<T, U>[] | null) {
  if (columns === null) return null

  return columns.map(column => column.width)
}

type RowProps<T, U> = {
  data: {
    data: U;
    columns: TableColumn<T, U>[];
  },
  index: number;
  style: React.CSSProperties;
}


function TableRow<T, U>(props: RowProps<T, U>) {
  const {
    style,
    data: { data, columns },
    index,
  } = props

  return (
    React.createElement('div', {
      style,
    }, columns.map(column =>
      column.renderRow(data, index)
    ))
  )
}

export default function makeTable<T, U>() {
  return function Table(props: TableData<T, U>) {
    const {
      getColumns,
      context,
      renderHeaderRows,
      rowHeight=DEFAULT_ROW_HEIGHT,
      itemData,
      itemCount,
    } = props

    const [ dimensions, setDimensions ] = useState<DimensionState>(null)
        , [ columns, setColumns ] = useState<TableColumn<T, U>[] | null>(null)

    const ref = useResizeCallback(el => {
      const tableEl = el.querySelector('.table-scroll')! as HTMLDivElement

      const dims = {
        height: tableEl.clientHeight,
        width: tableEl.clientWidth,

        // FIXME: is this right?
        widthWithScrollbar: tableEl.offsetWidth,
      }

      setColumns(getColumns(dims.width, props.context))
      setDimensions({ ...dims })
    })

    const widths = columnWidths(columns)

    const additionalRows = renderHeaderRows && widths &&
      renderHeaderRows(widths, context) || []

    return (
      h(TableWrapper, { ref }, [

        h(TableHeaderWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
        }, [
          ...additionalRows.map((node, i) =>
            React.createElement(TableHeaderRow, {
              rowHeight,
              key: `table-row-${i}`,
            }, node)
          ),

          h(TableHeaderRow, {
            rowHeight,
            key: 'column-headers',
          }, columns && widths && columns.map((col, i) =>
              h(TableHeaderCell, {
                key: col.key,
                left: R.sum(widths.slice(0, i + 1)),
                clickable: col.sort !== null,
                onClick: () => {
                  if (!col.sort) return

                  const active = col.sort.active(props.context)
                      , nextOrder = (active && props.sortOrder === 'asc') ? 'desc' : 'asc'

                  props.updateSort(col.sort.key, nextOrder)

                },
              }, [

                typeof col.label === 'string'
                  ? col.label
                  : col.label(props.context),

                col.sort === null ? null : (() => {
                  const active = col.sort.active(props.context)

                  if (!active) return null

                  return (
                    h('span', {
                      style: {
                        position: 'relative',
                        fontSize: 10,
                        top: -1,
                        left: 1,
                      },
                    }, props.sortOrder === 'asc' ? ' ▾' : ' ▴')
                  )
                })()
              ])
           )),

        ]),

        h(TableBodyWrapper, {
          rowHeight,
          numRows: additionalRows.length + 1,
          className: 'table-scroll',
          tableWidthSet: dimensions !== null,
        }, [
          dimensions && React.createElement(List, {
            itemCount,
            itemData: {
              data: itemData,
              columns,
            },
            itemSize: 24,

            height: dimensions.height,
            width: dimensions.widthWithScrollbar,

            children: TableRow,
          })
        ]),

        h('div.borders', {
        }, columns && widths && columns.map((col, i) =>
          !col.borderLeft ? null : (
            h('span', {
              style: {
                position: 'absolute',
                left: R.sum(widths.slice(0, i + 1)) - 8,
                top: 0,
                bottom: 0,
                borderLeft: '1px solid #ccc',
              },
            })
          )
        )),


      ])
    )
  }
}