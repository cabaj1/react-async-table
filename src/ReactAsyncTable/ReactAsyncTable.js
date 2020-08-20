import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HeaderSection from './HeaderSection';
import BodySection from './BodySection';
import {
  onChangePage,
  onSearch,
  onSort,
  onInsert,
  onEdit,
  onDelete,
  onMultipleDelete,
  onHeaderAction,
  onAction,
  onColumnClick
} from './helpers/defaultEvents';
import { Loader, GridItemComponent, ExpandableRowComponent } from './ReactAsyncTableComponents';
import { debounce, setCurrentPage } from './helpers/helpers';
// Table styles
import './scss/style.scss';

const propTypes = {
  keyField: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
  query: PropTypes.string.isRequired,
  activeTabID: PropTypes.string,
  requestFailed: PropTypes.bool,
  columns: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired,
  items: PropTypes.array.isRequired,
  currentPage: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number,
  totalItems: PropTypes.number.isRequired,
  delay: PropTypes.number,
  splitHeaderSection: PropTypes.bool,
  layoutType: PropTypes.string,
  bootstrapCheckbox: PropTypes.bool,
  displayHeaderSection: PropTypes.bool,
  tableHeader: PropTypes.string,
  tableHeaderIcon: PropTypes.string,
  tableClass: PropTypes.string,
  insertButtonClass: PropTypes.string,
  deleteButtonClass: PropTypes.string,
  tableHeaderClass: PropTypes.string,
  options: PropTypes.objectOf(PropTypes.bool),
  translations: PropTypes.objectOf(PropTypes.string),
  icons: PropTypes.objectOf(PropTypes.string),
  loader: PropTypes.func,
  actionsComponent: PropTypes.func,
  headerActions: PropTypes.func,
  gridItemComponent: PropTypes.func,
  expandableRowComponent: PropTypes.func,
  onChangePage: PropTypes.func,
  onSearch: PropTypes.func,
  onSort: PropTypes.func,
  onInsert: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onHeaderAction: PropTypes.func,
  onAction: PropTypes.func,
  onColumnClick: PropTypes.func,
  onMultipleDelete: PropTypes.func
};

const defaultProps = {
  isLoading: false,
  requestFailed: false,
  itemsPerPage: 10,
  activeTabID: '',
  delay: 300,
  displayHeaderSection: true,
  tableHeaderIcon: '',
  tableHeader: '',
  splitHeaderSection: false,
  layoutType: 'LIST_VIEW',
  bootstrapCheckbox: false,
  tableClass: '',
  insertButtonClass: 'btn btn-primary',
  deleteButtonClass: 'btn btn-danger',
  tableHeaderClass: '',
  options: {
    searchBox: true,
    insertButton: false,
    multipleSelect: false,
    expandable: false,
    actionsColumn: false,
    pagination: true
  },
  translations: {
    searchPlaceholder: 'Search...',
    addButton: 'Add',
    deleteButton: 'Delete',
    sortTitle: 'Sort',
    actionsColumnTitle: 'Actions',
    editAction: 'Edit',
    deleteAction: 'Delete',
    noDataText: 'No data found',
    requestFailedText: 'API request failed',
    paginationFirst: 'First',
    paginationLast: 'Last'
  },
  icons: {
    addButtonIcon: 'fa fa-plus',
    deleteButtonIcon: 'fa fa-trash',
    listViewIcon: "fa fa-list",
    gridViewIcon: "fa fa-th",
    tooltipIcon: 'fa fa-question',
    sortIcon: 'fa fa-sort',
    expandIcon: 'fa fa-expand',
    editActionIcon: 'fa fa-pencil',
    deleteActionIcon: 'fa fa-trash',
  },
  loader: Loader,
  gridItemComponent: GridItemComponent,
  expandableRowComponent: ExpandableRowComponent,
  onChangePage: onChangePage,
  onSearch: onSearch,
  onSort: onSort,
  onInsert: onInsert,
  onEdit: onEdit,
  onDelete: onDelete,
  onMultipleDelete: onMultipleDelete,
  onHeaderAction: onHeaderAction,
  onAction: onAction,
  onColumnClick: onColumnClick,
};

class ReactAsyncTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gridView: false,
      sortField: '',
      sortOrder: '',
      selectedCount: 0,
      selectAllItems: false,
      selectedItems: {},
      expandRow: {}
    };

    this.toggleGridView = this.toggleGridView.bind(this);
    this.onExpand = this.onExpand.bind(this);
    this.onMultipleSelect = this.onMultipleSelect.bind(this);
    this.onSort = this.onSort.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onMultipleDelete = this.onMultipleDelete.bind(this);
  }

  componentDidMount() {
    const { columns, layoutType } = this.props;

    // Set layout type
    if (layoutType === 'GRID_VIEW') this.setState({ gridView: true });

    // Set the default sort order
    for (const col of columns) {
      if (col.sort && col.sortOrder) {
        this.setState({ 
          sortField: col.dataField,
          sortOrder: col.sortOrder
        });
        break;
      }
    }
  }

  componentDidUpdate(prevProps) {
    // reset selected items on items array update
    if (this.props.options.multipleSelect && prevProps.items !== this.props.items) {
      this.setState({
        selectedCount: 0,
        selectAllItems: false,
        selectedItems: {},
        expandRow: {}
      });
    }
  }

  toggleGridView(gridViewState) {
    const { gridView } = this.state;

    if (gridView === gridViewState) return;

    this.setState({ gridView: gridViewState });
  }

  onSort(columnKey) {
    const { sortField, sortOrder } = this.state;
    let nextOrder = '';

    if (sortField === columnKey) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      nextOrder = 'asc';
    }

    this.setState({ sortField: columnKey, sortOrder: nextOrder });
    this.props.onSort(columnKey, nextOrder);
  }

  onDelete(rowID) {
    const { currentPage, itemsPerPage, totalItems } = this.props;

    const goToPage = setCurrentPage(currentPage, itemsPerPage, totalItems - 1);

    this.props.onDelete(rowID, goToPage);
  }

  onMultipleDelete() {
    const { keyField, items, currentPage, itemsPerPage, totalItems } = this.props;
    const { selectedItems } = this.state;
    const values = [];

    // detect keyField data type
    const itemID = items[0][keyField];
    const isString = typeof itemID === 'string';

    for (const [key, value] of Object.entries(selectedItems)) {
      if (value) values.push(isString ? key : parseInt(key, 10));
    }

    const goToPage = setCurrentPage(
      currentPage,
      itemsPerPage,
      totalItems - values.length
    );

    this.props.onMultipleDelete(values, goToPage);
  }

  onExpand(rowID) {
    const { options } = this.props;

    // Early exit if options.expandable prop is set to false
    if (!options.expandable) {
      event.preventDefault();
      return;
    }

    const { expandRow } = this.state;
    const prevValue = expandRow[rowID] || false;

    expandRow[rowID] = !prevValue;
    this.setState({ expandRow });
  }

  onSelect(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const { selectedCount, selectedItems } = this.state;
    const itemCount = value ? selectedCount + 1 : selectedCount - 1;

    selectedItems[name] = value;

    this.setState({ selectedCount: itemCount, selectedItems });
  }

  onMultipleSelect(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const { selectedItems } = this.state;
    const { keyField, items } = this.props;
    const itemCount = value ? items.length : 0;

    for (const item of items) {
      selectedItems[item[keyField]] = value;
    }

    this.setState({
      [name]: value,
      selectedCount: itemCount,
      selectedItems
    });
  }

  render() {
    const { selectAllItems, selectedCount, gridView, selectedItems, expandRow } = this.state;
    const {
      tableHeaderIcon,
      tableHeader,
      displayHeaderSection,
      splitHeaderSection,
      delay,
      onSearch
    } = this.props;

    const debounceSearch = debounce(searchTerm => {
      onSearch(searchTerm);
    }, delay);
    
    return (
      <div className="animated fadeIn">
        {splitHeaderSection ? (
          <React.Fragment>
            {displayHeaderSection && (
              <div className="card async-table-card-filter">
                {tableHeader && (
                  <div className="card-header">
                    {tableHeaderIcon && (<i className={tableHeaderIcon} />)}
                    {tableHeader}
                  </div>
                )}
                <div className="card-body">
                  <HeaderSection
                    {...this.props} 
                    selectedCount={selectedCount}
                    gridView={gridView}
                    toggleGridView={this.toggleGridView}
                    debounceSearch={debounceSearch}
                    onMultipleDelete={this.onMultipleDelete} 
                  />
                </div>
              </div>
            )}
            <div className="card async-table-card-content">
              <div className="card-body">
                <BodySection 
                  {...this.props} 
                  gridView={gridView}
                  selectedItems={selectedItems}
                  expandRow={expandRow}
                  selectAllItems={selectAllItems} 
                  onSelect={this.onSelect}
                  onMultipleSelect={this.onMultipleSelect}
                  onDelete={this.onDelete}
                  onExpand={this.onExpand}
                  onSort={this.onSort}
                />
              </div>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <HeaderSection
              {...this.props} 
              selectedCount={selectedCount}
              gridView={gridView}
              toggleGridView={this.toggleGridView}
              debounceSearch={debounceSearch}
              onMultipleDelete={this.onMultipleDelete} 
            />
            <BodySection 
              {...this.props} 
              gridView={gridView}
              selectedItems={selectedItems}
              expandRow={expandRow}
              selectAllItems={selectAllItems} 
              onSelect={this.onSelect}
              onMultipleSelect={this.onMultipleSelect}
              onDelete={this.onDelete}
              onExpand={this.onExpand}
              onSort={this.onSort}
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}

ReactAsyncTable.propTypes = propTypes;
ReactAsyncTable.defaultProps = defaultProps;
export default ReactAsyncTable;
