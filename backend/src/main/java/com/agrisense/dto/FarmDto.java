
package com.agrisense.dto;

import com.agrisense.entity.AreaUnit;

public class FarmDto {

    private Long id;
    private String name;
    private String location;

    // Legacy-compatible area input/output.
    private Double areaAcres;

    // New area input.
    private Double areaValue;
    private AreaUnit areaUnit;

    // Additional representation for responses.
    private Double areaHectares;

    public FarmDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getAreaAcres() {
        return areaAcres;
    }

    public void setAreaAcres(Double areaAcres) {
        this.areaAcres = areaAcres;
    }

    public Double getAreaValue() {
        return areaValue;
    }

    public void setAreaValue(Double areaValue) {
        this.areaValue = areaValue;
    }

    public AreaUnit getAreaUnit() {
        return areaUnit;
    }

    public void setAreaUnit(AreaUnit areaUnit) {
        this.areaUnit = areaUnit;
    }

    public Double getAreaHectares() {
        return areaHectares;
    }

    public void setAreaHectares(Double areaHectares) {
        this.areaHectares = areaHectares;
    }
}
