
package com.agrisense.entity;

/**
 * Units accepted for farm and plot area measurements.
 *
 * ACRES and HECTARES are supported.
 * The backend converts all measurements into acres
 * before persisting them in the database.
 */
public enum AreaUnit {
    ACRES,
    HECTARES
}
