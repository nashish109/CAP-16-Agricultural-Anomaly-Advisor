
package com.agrisense.controller;

import com.agrisense.entity.AreaUnit;
import com.agrisense.service.AreaConverter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FarmFieldApiTest {

    @Test
    void convertsHectaresToAcres() {

        double acres = AreaConverter.toCanonicalAcres(
                null,
                1.0,
                AreaUnit.HECTARES
        );

        assertEquals(2.471054, acres, 0.000001);
    }

    @Test
    void convertsAcresToHectares() {

        double hectares = AreaConverter.toHectares(1.0);

        assertEquals(0.404686, hectares, 0.000001);
    }

    @Test
    void acceptsLegacyAreaAcres() {

        double acres = AreaConverter.toCanonicalAcres(
                5.0,
                null,
                null
        );

        assertEquals(5.0, acres);
    }

    @Test
    void rejectsZeroArea() {

        assertThrows(
                RuntimeException.class,
                () -> AreaConverter.toCanonicalAcres(
                        null,
                        0.0,
                        AreaUnit.ACRES
                )
        );
    }

    @Test
    void rejectsNegativeArea() {

        assertThrows(
                RuntimeException.class,
                () -> AreaConverter.toCanonicalAcres(
                        null,
                        -2.0,
                        AreaUnit.HECTARES
                )
        );
    }

    @Test
    void rejectsInfiniteArea() {

        assertThrows(
                RuntimeException.class,
                () -> AreaConverter.toCanonicalAcres(
                        null,
                        Double.POSITIVE_INFINITY,
                        AreaUnit.ACRES
                )
        );
    }

    @Test
    void rejectsBothLegacyAndNewAreaInputs() {

        assertThrows(
                RuntimeException.class,
                () -> AreaConverter.toCanonicalAcres(
                        5.0,
                        2.0,
                        AreaUnit.ACRES
                )
        );
    }

    @Test
    void rejectsMissingArea() {

        assertThrows(
                RuntimeException.class,
                () -> AreaConverter.toCanonicalAcres(
                        null,
                        null,
                        null
                )
        );
    }
}
