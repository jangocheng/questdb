import React, { useCallback, useEffect, useState } from "react"
import { CSSTransition } from "react-transition-group"
import { from, combineLatest, of } from "rxjs"
import { delay, startWith } from "rxjs/operators"
import styled from "styled-components"
import { Loader4 } from "@styled-icons/remix-line/Loader4"
import {
  collapseTransition,
  spinAnimation,
  TransitionDuration,
} from "components"
import { color } from "utils"
import * as QuestDB from "utils/questdb"
import Row from "../Row"

type Props = QuestDB.Table &
  Readonly<{
    expanded: boolean
    description?: string
    onChange: (table: string) => void
    refresh: number
    table: string
  }>

type TitleProps = Readonly<{ expanded: boolean }>

const Wrapper = styled.div`
  display: flex;
  margin-top: 0.5rem;
  align-items: stretch;
  flex-direction: column;
  overflow: hidden;

  ${collapseTransition};
`

const Title = styled(Row)`
  display: flex;
  align-items: stretch;
  font-weight: ${({ expanded }) => (expanded ? 800 : 400)};

  &:hover {
    cursor: pointer;
  }
`

const Columns = styled.div`
  position: relative;
  display: flex;
  margin-left: 3rem;
  flex-direction: column;

  &:before {
    position: absolute;
    height: 100%;
    width: 2px;
    left: -1.2rem;
    top: 0;
    content: "";
    background: ${color("gray1")};
  }
`

const Loader = styled(Loader4)`
  margin-left: 1rem;
  color: ${color("draculaOrange")};
  ${spinAnimation};
`

const Table = ({ description, expanded, onChange, refresh, table }: Props) => {
  const [quest] = useState(new QuestDB.Client())
  const [loading, setLoading] = useState(false)
  const [columns, setColumns] = useState<QuestDB.Column[]>()

  useEffect(() => {
    if (expanded) {
      combineLatest(
        from(quest.showColumns(table)).pipe(startWith(null)),
        of(true).pipe(delay(1000), startWith(false)),
      ).subscribe(([response, loading]) => {
        if (response && response.type === QuestDB.Type.DQL) {
          setColumns(response.data)
          setLoading(false)
        } else {
          setLoading(loading)
        }
      })
    }
  }, [expanded, refresh, quest, table])

  const handleClick = useCallback(() => {
    onChange(expanded ? "" : table)
  }, [expanded, onChange, table])

  return (
    <Wrapper _height={columns ? columns.length * 30 : 0}>
      <Title
        description={description}
        expanded={expanded}
        kind="table"
        name={table}
        onClick={handleClick}
        suffix={loading && <Loader size="18px" />}
        tooltip={!!description}
      />

      <CSSTransition
        classNames="collapse"
        in={expanded}
        timeout={TransitionDuration.REG}
        unmountOnExit
      >
        <Columns>
          {columns &&
            columns.map((column) => (
              <Row
                {...column}
                key={`${column.column}-${column.type}${
                  column.indexed ? "-i" : ""
                }`}
                kind="column"
                name={column.column}
              />
            ))}
        </Columns>
      </CSSTransition>
    </Wrapper>
  )
}

export default Table
