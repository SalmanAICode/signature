// allow nested columns

export const TABLE_COLUMN_WIDTH = 200;
export const TABLE_COLUMN_MIN_WIDTH = 100;

export type ColumnConfig<T> =
    | {
        key: string;
        label: string;
        render?: (value: any, row?: T) => React.ReactNode;
        visible?: boolean;
    }
    | {
        key: string;
        label: string;
        columns: ColumnConfig<T>[];
        render?: (value: any, row?: T) => React.ReactNode;
        visible?: boolean;
    };

export type SortDirection = 'asc' | 'desc' | null;

export type SortKey = string | null;