
package com.agrisense.service;

import com.agrisense.dto.CropDto;
import com.agrisense.entity.Crop;
import com.agrisense.entity.Field;
import com.agrisense.entity.Role;
import com.agrisense.entity.User;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
        User user = currentUserService.getCurrentUser();

        if (fieldId != null) {
            fieldService.getAccessibleField(fieldId);

            return cropRepository.findByFieldId(fieldId).stream()
                    .map(this::toDto)
                    .toList();
        }

        List<Crop> crops;

        if (user.getRole() == Role.ANALYST || user.getRole() == Role.ADMIN) {
            crops = cropRepository.findAll();
        } else {
            crops = cropRepository.findByFieldFarmUserId(user.getId());
        }

        return crops.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CropDto findById(Long id) {
        return toDto(getAccessibleCrop(id));
    }

    @Transactional
    public CropDto create(CropDto dto) {
        User user = currentUserService.getCurrentUser();
        ensureCropManagementAllowed(user);

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
        User user = currentUserService.getCurrentUser();
        ensureCropManagementAllowed(user);

        Crop crop = getOwnedCrop(id);

        if (dto.getFieldId() != null
                && !dto.getFieldId().equals(crop.getField().getId())) {
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
        User user = currentUserService.getCurrentUser();
        ensureCropManagementAllowed(user);

        cropRepository.delete(getOwnedCrop(id));
    }

    @Transactional(readOnly = true)
    public Crop getAccessibleCrop(Long id) {
        User user = currentUserService.getCurrentUser();

        if (user.getRole() == Role.ANALYST || user.getRole() == Role.ADMIN) {
            return cropRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Crop", id));
        }

        return getOwnedCrop(id);
    }

    @Transactional(readOnly = true)
    public Crop getOwnedCrop(Long id) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop", id));

        User user = currentUserService.getCurrentUser();

        if (!crop.getField().getFarm().getUser().getId().equals(user.getId())
                && user.getRole() != Role.ADMIN) {
            throw new ResourceNotFoundException("Crop", id);
        }

        return crop;
    }

    private void ensureCropManagementAllowed(User user) {
        if (user.getRole() == Role.ANALYST) {
            throw new AccessDeniedException("Analysts cannot manage crops");
        }
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
