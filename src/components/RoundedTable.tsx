import { Table, type TableScrollContainerProps } from "@mantine/core";
import classes from "./RoundedTable.module.css";

export function RoundedTableContainer({ children, ...props }: TableScrollContainerProps) {
  return (
    <Table.ScrollContainer className={classes.container} {...props}>
      {children}
    </Table.ScrollContainer>
  );
}
