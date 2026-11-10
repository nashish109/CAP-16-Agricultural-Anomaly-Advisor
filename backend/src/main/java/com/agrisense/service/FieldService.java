package com.agrisense.service;

import com.agrisense.dto.FieldDto;
import com.agrisense.entity.Farm;
import com.agrisense.entity.Field;
import com.agrisense.entity.FieldStatus;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FieldService {

    private final FieldRepository fieldRepository;
    private final FarmService farmService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<FieldDto> findAll(Long farmId) {
        if (farmId != null) {
            farmService.getOwnedFarm(farmId);
            return fieldRepository.findByFarmId(farmId).stream().map(this::toDto).toList();
        }
        return fieldRepository.findByFarmUserId(currentUserService.getCurrentUserId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FieldDto findById(Long id) {
        return toDto(getOwnedField(id));
    }

    @Transactional
    public FieldDto create(FieldDto dto) {
        Farm farm = farmService.getOwnedFarm(dto.getFarmId());
        Field field = Field.builder()
                .name(dto.getName())
                .areaAcres(dto.getAreaAcres())
                .cropType(dto.getCropType())
                .status(dto.getStatus() != null ? dto.getStatus() : FieldStatus.HEALTHY)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .farm(farm)
                .build();
        return toDto(fieldRepository.save(field));
    }

    @Transactional
    public FieldDto update(Long id, FieldDto dto) {
        Field field = getOwnedField(id);
        if (dto.getFarmId() != null && !dto.getFarmId().equals(field.getFarm().getId())) {
            Farm farm = farmService.getOwnedFarm(dto.getFarmId());
            field.setFarm(farm);
        }
        field.setName(dto.getName());
        field.setAreaAcres(dto.getAreaAcres());
        field.setCropType(dto.getCropType());
        if (dto.getStatus() != null) {
            field.setStatus(dto.getStatus());
        }
        field.setLatitude(dto.getLatitude());
        field.setLongitude(dto.getLongitude());
        return toDto(fieldRepository.save(field));
    }

    @Transactional
    public void delete(Long id) {
        fieldRepository.delete(getOwnedField(id));
    }

    public Field getOwnedField(Long id) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field", id));
        Long currentUserId = currentUserService.getCurrentUserId();
        if (!field.getFarm().getUser().getId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Field", id);
        }
        return field;
    }

    private FieldDto toDto(Field field) {
        return FieldDto.builder()
                .id(field.getId())
                .name(field.getName())
                .areaAcres(field.getAreaAcres())
                .cropType(field.getCropType())
                .status(field.getStatus())
                .latitude(field.getLatitude())
                .longitude(field.getLongitude())
                .farmId(field.getFarm().getId())
                .farmName(field.getFarm().getName())
                .build();
    }
}
