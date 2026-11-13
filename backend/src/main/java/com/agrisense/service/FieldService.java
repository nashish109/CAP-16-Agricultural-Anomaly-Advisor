
package com.agrisense.service;

import com.agrisense.dto.FieldDto;
import com.agrisense.entity.Farm;
import com.agrisense.entity.Field;
import com.agrisense.entity.FieldStatus;
import com.agrisense.entity.Role;
import com.agrisense.entity.User;
import com.agrisense.exception.ResourceNotFoundException;
import com.agrisense.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
        User user = currentUserService.getCurrentUser();

        if (farmId != null) {
            farmService.getAccessibleFarm(farmId);

            return fieldRepository.findByFarmId(farmId).stream()
                    .map(this::toDto)
                    .toList();
        }

        List<Field> fields;

        if (user.getRole() == Role.ANALYST || user.getRole() == Role.ADMIN) {
            fields = fieldRepository.findAll();
        } else {
            fields = fieldRepository.findByFarmUserId(user.getId());
        }

        return fields.stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FieldDto findById(Long id) {
        return toDto(getAccessibleField(id));
    }

    @Transactional
    public FieldDto create(FieldDto dto) {
        User user = currentUserService.getCurrentUser();
        ensureFieldManagementAllowed(user);

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
        User user = currentUserService.getCurrentUser();
        ensureFieldManagementAllowed(user);

        Field field = getOwnedField(id);

        if (dto.getFarmId() != null
                && !dto.getFarmId().equals(field.getFarm().getId())) {

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
        User user = currentUserService.getCurrentUser();
        ensureFieldManagementAllowed(user);

        fieldRepository.delete(getOwnedField(id));
    }

    @Transactional(readOnly = true)
    public Field getAccessibleField(Long id) {
        User user = currentUserService.getCurrentUser();

        if (user.getRole() == Role.ANALYST || user.getRole() == Role.ADMIN) {
            return fieldRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Field", id));
        }

        return getOwnedField(id);
    }

    @Transactional(readOnly = true)
    public Field getOwnedField(Long id) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field", id));

        User user = currentUserService.getCurrentUser();

        if (!field.getFarm().getUser().getId().equals(user.getId())
                && user.getRole() != Role.ADMIN) {
            throw new ResourceNotFoundException("Field", id);
        }

        return field;
    }

    private void ensureFieldManagementAllowed(User user) {
        if (user.getRole() == Role.ANALYST) {
            throw new AccessDeniedException("Analysts cannot manage fields");
        }
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
