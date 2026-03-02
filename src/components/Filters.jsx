import Select from "react-select";

export default function Filters({
  searchText,
  setSearchText,
  filterLocation,
  setFilterLocation,
  filterCompany,
  setFilterCompany,
  filterCategory,
  setFilterCategory,
  locationOptions,
  companyOptions,
  categoryOptions,
  selectStyles,
}) {
  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search jobs, companies, skills..."
        className="filter-input"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Select
        placeholder="All Locations"
        options={locationOptions}
        isClearable
        styles={selectStyles}
        value={
          filterLocation
            ? { value: filterLocation, label: filterLocation }
            : null
        }
        onChange={(opt) => setFilterLocation(opt?.value || "")}
      />

      <Select
        placeholder="All Companies"
        options={companyOptions}
        isClearable
        styles={selectStyles}
        value={
          filterCompany ? { value: filterCompany, label: filterCompany } : null
        }
        onChange={(opt) => setFilterCompany(opt?.value || "")}
      />

      <Select
        placeholder="Filter By Keywords"
        options={categoryOptions}
        isClearable
        styles={selectStyles}
        value={
          filterCategory
            ? { value: filterCategory, label: filterCategory }
            : null
        }
        onChange={(opt) => setFilterCategory(opt?.value || "")}
      />
    </div>
  );
}
