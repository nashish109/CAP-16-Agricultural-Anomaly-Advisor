
package com.agrisense.service;

import com.agrisense.entity.AreaUnit;
import com.agrisense.exception.BadRequestException;

public final class AreaConverter {

    private static final double ACRES_PER_HECTARE = 2.4710538147;
    private static final double HECTARES_PER_ACRE = 0.4046856422;

    private AreaConverter() {
    }

    public static double toCanonicalAcres(
            Double legacyAreaAcres,
            Double areaValue,
            AreaUnit areaUnit) {

        if (legacyAreaAcres != null && areaValue != null) {
            throw new BadRequestException(
                    "Provide either areaAcres or areaValue with areaUnit, not both."
            );
        }

        if (legacyAreaAcres != null) {
            return validateAndRound(legacyAreaAcres, AreaUnit.ACRES);
        }

        if (areaValue == null) {
            throw new BadRequestException(
                    "A positive area measurement and its unit are required."
            );
        }

        return validateAndRound(
                areaValue,
                areaUnit == null ? AreaUnit.ACRES : areaUnit
        );
    }

    public static Double toHectares(Double acres) {
        return acres == null
                ? null
                : roundToSixDecimals(acres * HECTARES_PER_ACRE);
    }

    private static double validateAndRound(double value, AreaUnit unit) {

        if (!Double.isFinite(value) || value <= 0) {
            throw new BadRequestException(
                    "Area must be a finite number greater than zero."
            );
        }

        double acres = unit == AreaUnit.HECTARES
                ? value * ACRES_PER_HECTARE
                : value;

        if (!Double.isFinite(acres) || acres <= 0) {
            throw new BadRequestException(
                    "Area conversion produced an invalid value."
            );
        }

        return roundToSixDecimals(acres);
    }

    private static double roundToSixDecimals(double value) {
        return Math.round(value * 1_000_000d) / 1_000_000d;
    }
}
