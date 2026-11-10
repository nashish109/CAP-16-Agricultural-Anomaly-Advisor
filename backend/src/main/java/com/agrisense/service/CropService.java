package com.agrisense.service;

import com.agrisense.dto.CropDto;
import com.agrisense.entity.Crop;
import com.agrisense.entity.Field;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CropService {

    private final CropRepository cropRepository;
    private final FieldService fieldService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<CropDto> findAll(Long fieldId) {
        if (fieldId != null) {
            fieldService.getOwnedField(fieldId);
            return cropRepository.findByFieldId(fieldId).stream().map(this::toDto).toList();
        }
        return cropRepository.findByFieldFarmUserId(currentUserService.getCurrentUserId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CropDto findById(Long id) {
        return toDto(getOwnedCrop(id));
    }

    @Transactional
    public CropDto create(CropDto dto) {
        Field field = fieldService.getOwnedField(dto.getFieldId());
        Crop crop = Crop.builder()
                .name(dto.getName())
                .variety(dto.getVariety())
                .plantingDate(dto.getPlantingDate())
                .expectedHarvestDate(dto.getExpectedHarvestDate())
                .growthStage(dto.getGrowthStage())
                .healthStatus(dto.getHealthStatus())
                .areaAcres(dto.getAreaAcres())
                .field(field)
                .build();
        return toDto(cropRepository.save(crop));
    }

    @Transactional
    public CropDto update(Long id, CropDto dto) {
        Crop crop = getOwnedCrop(id);
        if (dto.getFieldId() != null && !dto.getFieldId().equals(crop.getField().getId())) {
            crop.setField(fieldService.getOwnedField(dto.getFieldId()));
        }
        crop.setName(dto.getName());
        crop.setVariety(dto.getVariety());
        crop.setPlantingDate(dto.getPlantingDate());
        crop.setExpectedHarvestDate(dto.getExpectedHarvestDate());
        crop.setGrowthStage(dto.getGrowthStage());
        crop.setHealthStatus(dto.getHealthStatus());
        crop.setAreaAcres(dto.getAreaAcres());
        return toDto(cropRepository.save(crop));
    }

    @Transactional
    public void delete(Long id) {
        cropRepository.delete(getOwnedCrop(id));
    }

    private Crop getOwnedCrop(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop", id));
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!crop.getField().getFarm().getUser().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Crop", id);
        }
        return crop;
    }

    private CropDto toDto(Crop crop) {
        return CropDto.builder()
                .id(crop.getId())
                .name(crop.getName())
                .variety(crop.getVariety())
                .plantingDate(crop.getPlantingDate())
                .expectedHarvestDate(crop.getExpectedHarvestDate())
                .growthStage(crop.getGrowthStage())
                .healthStatus(crop.getHealthStatus())
                .areaAcres(crop.getAreaAcres())
                .fieldId(crop.getField().getId())
                .fieldName(crop.getField().getName())
                .build();
    }
}
